
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getHolidays(programId?: string) {
    if (!programId) return [];
    return await prisma.holiday.findMany({
        where: { programId },
        orderBy: { date: "asc" },
    });
}

export async function addHoliday(formData: FormData) {
    const name = formData.get("name") as string;
    const dateStr = formData.get("date") as string;
    const programId = formData.get("programId") as string;

    if (!name || !dateStr || !programId) {
        throw new Error("Missing required fields");
    }

    await prisma.holiday.create({
        data: {
            name,
            date: new Date(dateStr),
            programId,
        },
    });

    revalidatePath("/admin/holidays");
}

export async function deleteHoliday(id: string) {
    await prisma.holiday.delete({ where: { id } });
    revalidatePath("/admin/holidays");
}
