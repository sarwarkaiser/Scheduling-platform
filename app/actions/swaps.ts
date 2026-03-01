"use server";

import { SwapWorkflowModule, SwapRequestInput } from "@/lib/modules/workflow/swap";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const swapWorkflow = new SwapWorkflowModule();

export async function requestSwap(input: SwapRequestInput) {
    try {
        await swapWorkflow.createSwapRequest(input);
        revalidatePath("/admin/requests");
        revalidatePath("/dashboard/swaps");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function validateSwap(input: SwapRequestInput) {
    const result = await swapWorkflow.preCheckSwap(input);
    return result;
}

export async function postOpenSwap(assignmentId: string, reason?: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return { success: false, error: "Not authenticated" };

    const resident = await prisma.resident.findFirst({
        where: { user: { email: session.user.email }, active: true },
    });
    if (!resident) return { success: false, error: "Resident profile not found" };

    return requestSwap({ requesterId: resident.id, assignmentId, reason });
}

export async function getSwapBoard(programId: string) {
    return prisma.swapRequest.findMany({
        where: { programId, status: "pending" },
        include: {
            requester: { include: { user: true } },
            assignment: {
                include: {
                    shiftInstance: { include: { shiftTemplate: true } },
                    site: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function getMySwapRequests() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return [];

    const resident = await prisma.resident.findFirst({
        where: { user: { email: session.user.email }, active: true },
        include: { program: true },
    });
    if (!resident) return [];

    return prisma.swapRequest.findMany({
        where: { requesterId: resident.id },
        include: {
            assignment: {
                include: {
                    shiftInstance: { include: { shiftTemplate: true } },
                    site: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}

