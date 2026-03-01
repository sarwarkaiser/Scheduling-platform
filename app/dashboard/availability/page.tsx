import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AvailabilityManager from "@/components/resident/AvailabilityManager";
import Link from "next/link";

export default async function AvailabilityPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) redirect("/login");

    const resident = await prisma.resident.findFirst({
        where: { user: { email: session.user.email }, active: true },
    });
    if (!resident) redirect("/dashboard");

    const availabilities = await prisma.availability.findMany({
        where: { residentId: resident.id },
        orderBy: { startDate: "asc" },
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center space-x-4">
                    <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm">
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-xl font-bold dark:text-white">Set Availability</h1>
                </div>
            </header>
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AvailabilityManager residentId={resident.id} availabilities={availabilities} />
            </main>
        </div>
    );
}
