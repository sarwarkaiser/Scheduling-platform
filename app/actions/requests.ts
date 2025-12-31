"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getRequests(programId?: string) {
    return await prisma.availability.findMany({
        where: programId ? { resident: { programId } } : {},
        include: {
            resident: {
                include: { user: true }
            }
        },
        orderBy: { startDate: "asc" },
    });
}

export async function createRequest(formData: FormData) {
    const residentId = formData.get("residentId") as string;
    const type = formData.get("type") as string;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const reason = formData.get("reason") as string;

    if (!residentId || !type || !startDate || !endDate) {
        throw new Error("Missing required fields");
    }

    await prisma.availability.create({
        data: {
            residentId,
            type,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            reason,
            approved: true, // Auto-approve admin requests
        },
    });

    revalidatePath("/admin/requests");
}

export async function deleteRequest(id: string) {
    await prisma.availability.delete({
        where: { id }
    });
    revalidatePath("/admin/requests");
}
