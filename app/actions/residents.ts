"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getResidents(programId?: string) {
    return await prisma.resident.findMany({
        where: programId ? { programId } : undefined,
        include: {
            user: true,
            program: true,
            programYear: true,
        },
        orderBy: { user: { name: "asc" } },
    });
}

export async function createResident(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const programId = formData.get("programId") as string;
    const pgyLevel = parseInt(formData.get("pgyLevel") as string);
    const startDate = formData.get("startDate") as string;
    // const endDate = formData.get("endDate") as string;

    if (!name || !email || !programId || !pgyLevel) {
        throw new Error("Missing required fields");
    }

    // 1. Find or create User
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        user = await prisma.user.create({
            data: { email, name },
        });
    }

    // 2. Find or create ProgramYear
    let programYear = await prisma.programYear.findFirst({
        where: { programId, name: `PGY-${pgyLevel}` },
    });

    if (!programYear) {
        programYear = await prisma.programYear.create({
            data: {
                programId,
                name: `PGY-${pgyLevel}`,
                year: pgyLevel,
            },
        });
    }

    // 3. Create Resident
    const resident = await prisma.resident.create({
        data: {
            userId: user.id,
            programId,
            programYearId: programYear.id,
            active: true,
            startDate: startDate ? new Date(startDate) : new Date(),
        },
    });

    revalidatePath("/admin/residents");
    return resident;
}

export async function updateResident(id: string, formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const programId = formData.get("programId") as string;
    const pgyLevel = parseInt(formData.get("pgyLevel") as string);
    const startDate = formData.get("startDate") as string;
    const active = formData.get("active") === "true";

    // 1. Update User
    const resident = await prisma.resident.findUnique({ where: { id }, include: { user: true } });
    if (resident && resident.userId) {
        await prisma.user.update({
            where: { id: resident.userId },
            data: { name, email },
        });
    }

    // 2. Find/Create Program Year
    let programYearId = resident?.programYearId;
    if (pgyLevel) {
        let programYear = await prisma.programYear.findFirst({
            where: { programId, name: `PGY-${pgyLevel}` },
        });

        if (!programYear) {
            programYear = await prisma.programYear.create({
                data: {
                    programId,
                    name: `PGY-${pgyLevel}`,
                    year: pgyLevel,
                },
            });
        }
        programYearId = programYear.id;
    }

    // 3. Update Resident
    await prisma.resident.update({
        where: { id },
        data: {
            programId,
            programYearId,
            active,
            startDate: startDate ? new Date(startDate) : undefined,
        },
    });

    revalidatePath("/admin/residents");
}

export async function deleteResident(id: string) {
    await prisma.resident.delete({ where: { id } });
    revalidatePath("/admin/residents");
}
