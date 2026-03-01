import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SwapBoard from "@/components/resident/SwapBoard";
import Link from "next/link";

export default async function SwapsPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) redirect("/login");

    const resident = await prisma.resident.findFirst({
        where: { user: { email: session.user.email }, active: true },
        include: { program: true },
    });
    if (!resident) redirect("/dashboard");

    // All open/pending swap requests in the same program (not the resident's own)
    const openSwaps = await prisma.swapRequest.findMany({
        where: {
            programId: resident.programId,
            status: "pending",
            requesterId: { not: resident.id },
        },
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

    // The resident's own pending swap requests
    const mySwaps = await prisma.swapRequest.findMany({
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
        take: 10,
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center space-x-4">
                    <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm">
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-xl font-bold dark:text-white">Swap Board</h1>
                </div>
            </header>
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <SwapBoard
                    openSwaps={openSwaps as any}
                    mySwaps={mySwaps as any}
                    residentId={resident.id}
                />
            </main>
        </div>
    );
}
