import { getRulesForProgram } from "@/app/actions/rules";
import { getPrograms } from "@/app/actions/programs";
import RulesManager from "@/components/admin/rules/RulesManager";

export default async function RulesPage() {
    const programs = await getPrograms();
    const firstProgramId = programs[0]?.id || "";
    const initialRules = firstProgramId ? await getRulesForProgram(firstProgramId) : [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold dark:text-white">Rules</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Set scheduling limits for each program. These are applied automatically during schedule generation.
                </p>
            </div>
            <RulesManager
                programs={programs}
                initialRules={initialRules as any}
                initialProgramId={firstProgramId}
            />
        </div>
    );
}
