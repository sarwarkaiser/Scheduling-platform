"use server";

import { prisma } from "@/lib/prisma";

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

    // Transform for easier consumption
    // Group by date? Or just return flat list?
    // Let's return flat list of "Shift Events"
    return shiftInstances.map((si) => ({
        id: si.id,
        title: si.shiftTemplate.name,
        start: si.startTime,
        end: si.endTime,
        resident: si.assignments[0]?.resident?.user?.name || "Unassigned",
        residentId: si.assignments[0]?.residentId,
        color: si.status === 'PUBLISHED' ? '#3b82f6' : '#9ca3af',
    }));
}
