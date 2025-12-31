import { getRuleSets } from "@/app/actions/rules";
import { getPrograms } from "@/app/actions/programs";
import { prisma } from "@/lib/prisma";
import RulesManager from "@/components/admin/rules/RulesManager";

export default async function RulesPage() {
    const ruleSets = await getRuleSets();
    const programs = await getPrograms();
    const programYears = await prisma.programYear.findMany({ orderBy: { name: 'asc' } });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold dark:text-white">Rules & Constraints</h1>
            <p className="text-gray-500 dark:text-gray-400">
                Define the limits and patterns for schedule generation.
            </p>

            <RulesManager
                ruleSets={ruleSets}
                programs={programs}
                programYears={programYears}
            />
        </div>
    );
}
