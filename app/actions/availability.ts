"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function submitAvailabilityRequest(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error("Not authenticated");

    const resident = await prisma.resident.findFirst({
        where: { user: { email: session.user.email }, active: true },
    });
    if (!resident) throw new Error("Resident profile not found");

    const type = formData.get("type") as string;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const reason = formData.get("reason") as string;

    if (!type || !startDate || !endDate) {
        throw new Error("Missing required fields");
    }

    await prisma.availability.create({
        data: {
            residentId: resident.id,
            type,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            reason: reason || null,
            approved: false,
        },
    });

    revalidatePath("/dashboard/availability");
}

export async function getMyAvailability() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return [];

    const resident = await prisma.resident.findFirst({
        where: { user: { email: session.user.email }, active: true },
    });
    if (!resident) return [];

    return prisma.availability.findMany({
        where: { residentId: resident.id },
        orderBy: { startDate: "asc" },
    });
}

export async function deleteMyAvailability(id: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error("Not authenticated");

    const resident = await prisma.resident.findFirst({
        where: { user: { email: session.user.email }, active: true },
    });

    // Only allow deleting own, unapproved requests
    const record = await prisma.availability.findUnique({ where: { id } });
    if (!record || record.residentId !== resident?.id || record.approved) {
        throw new Error("Cannot delete this request");
    }

    await prisma.availability.delete({ where: { id } });
    revalidatePath("/dashboard/availability");
}
