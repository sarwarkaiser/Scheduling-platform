
import { getFairnessReport } from "@/app/actions/reports";
import { getPrograms } from "@/app/actions/programs";
import FairnessTable from "@/components/admin/reports/FairnessTable";

export default async function FairnessPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    const programs = await getPrograms();
    const programId = (searchParams.programId as string) || (programs.length > 0 ? programs[0].id : "");

    // Default to current academic year (July 1 - June 30) or just last 30 days for now
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // In a real app, parse from searchParams
    const startParam = searchParams.startDate as string;
    const endParam = searchParams.endDate as string;

    const activeStart = startParam ? new Date(startParam) : startDate;
    const activeEnd = endParam ? new Date(endParam) : endDate;

    let report = null;
    if (programId) {
        report = await getFairnessReport(programId, activeStart, activeEnd);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold dark:text-white">Fairness & Workload Report</h1>
                {/* Future: Date Range Picker & Program Selector */}
            </div>

            {report ? (
                <FairnessTable
                    report={report}
                    programId={programId}
                    startDate={activeStart}
                    endDate={activeEnd}
                />
            ) : (
                <p>Please select a program.</p>
            )}
        </div>
    );
}
