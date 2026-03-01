import { prisma } from "@/lib/prisma";
import ResidentDashboard from "@/components/resident/ResidentDashboard";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        redirect("/login");
    }

    const resident = await prisma.resident.findFirst({
        where: { user: { email: session.user.email }, active: true },
        include: {
            user: true,
            program: true,
            programYear: true
        }
    });

    if (!resident) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500">Resident profile not found.</p>
            </div>
        );
    }

    const assignments = await prisma.assignment.findMany({
        where: {
            residentId: resident.id,
            shiftInstance: {
                date: {
                    gte: new Date(),
                }
            }
        },
        include: {
            shiftInstance: {
                include: {
                    shiftTemplate: true
                }
            },
            site: true
        },
        orderBy: {
            shiftInstance: {
                date: 'asc'
            }
        },
        take: 5
    });

    return <ResidentDashboard resident={resident} assignments={assignments} />;
}
