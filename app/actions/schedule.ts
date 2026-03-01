"use server";

import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";

export type ScheduleViewData = {
    date: Date;
    shifts: {
        id: string;
        shiftName: string;
        startTime: Date;
        endTime: Date;
        residentName?: string;
        residentId?: string;
    }[];
};

export async function getSchedule(
    programId: string,
    startDate: string,
    endDate: string
) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const shiftInstances = await prisma.shiftInstance.findMany({
        where: {
            shiftTemplate: {
                programId: programId,
            },
            date: {
                gte: start,
                lte: end,
            },
        },
        include: {
            shiftTemplate: true,
            assignments: {
                include: {
                    resident: {
                        include: { user: true },
                    },
                },
            },
        },
        orderBy: {
            date: "asc",
        },
    });

    return shiftInstances.map((si) => ({
        id: si.id,
        title: si.shiftTemplate.name,
        dateStr: si.date.toISOString().slice(0, 10), // "YYYY-MM-DD"
        start: si.startTime,
        end: si.endTime,
        residents: si.assignments.map((a) => ({
            id: a.residentId,
            name: a.resident?.user?.name || "?",
        })),
        // keep legacy fields for backwards compat with list view
        resident: si.assignments[0]?.resident?.user?.name || "Unassigned",
        residentId: si.assignments[0]?.residentId,
        status: si.status,
    }));
}

export async function notifyResidents(programId: string): Promise<{ sent: number; skipped: number }> {
    const today = new Date();
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);

    // Get all assignments in the next 7 days for this program
    const assignments = await prisma.assignment.findMany({
        where: {
            shiftInstance: {
                shiftTemplate: { programId },
                date: { gte: today, lte: weekEnd },
            },
        },
        include: {
            resident: { include: { user: true } },
            shiftInstance: { include: { shiftTemplate: true } },
            site: true,
        },
        orderBy: { shiftInstance: { date: "asc" } },
    });

    // Group by resident
    const byResident: Record<string, typeof assignments> = {};
    for (const a of assignments) {
        const email = a.resident.user.email;
        if (!email) continue;
        if (!byResident[email]) byResident[email] = [];
        byResident[email].push(a);
    }

    let sent = 0;
    let skipped = 0;

    for (const [email, shifts] of Object.entries(byResident)) {
        const name = shifts[0].resident.user.name || "Resident";
        const rows = shifts.map((s) => {
            const date = new Date(s.shiftInstance.date).toLocaleDateString("en-US", {
                weekday: "short", month: "short", day: "numeric",
            });
            return `<tr>
                <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${date}</td>
                <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${s.shiftInstance.shiftTemplate.name}</td>
                <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${s.site.name}</td>
            </tr>`;
        }).join("");

        const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
  <h2 style="color:#4f46e5">Your Upcoming Shifts</h2>
  <p>Hi ${name}, here are your shifts for the next 7 days:</p>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <thead>
      <tr style="background:#f3f4f6;text-align:left">
        <th style="padding:8px 12px">Date</th>
        <th style="padding:8px 12px">Shift</th>
        <th style="padding:8px 12px">Site</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p style="color:#6b7280;font-size:12px;margin-top:24px">
    Log in to view the full schedule or request a swap.
  </p>
</div>`;

        try {
            await sendMail(email, "Your upcoming shifts — next 7 days", html);
            sent++;
        } catch {
            skipped++;
        }
    }

    return { sent, skipped };
}
