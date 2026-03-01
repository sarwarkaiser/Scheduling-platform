import { getPrograms } from "@/app/actions/programs";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
    const [programs, residentCount, programCount, pendingRequests] = await Promise.all([
        getPrograms(),
        prisma.resident.count({ where: { active: true } }),
        prisma.program.count(),
        prisma.swapRequest.count({ where: { status: "PENDING" } }).catch(() => 0),
    ]);

    return (
        <AdminDashboard
            programs={programs}
            stats={{ residents: residentCount, programs: programCount, pendingRequests }}
        />
    );
}
