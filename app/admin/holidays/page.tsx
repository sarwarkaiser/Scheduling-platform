
import { getHolidays } from "@/app/actions/holidays";
import { getPrograms } from "@/app/actions/programs";
import AddHolidayForm from "@/components/admin/holidays/AddHolidayForm";
import HolidayList from "@/components/admin/holidays/HolidayList";

export default async function HolidaysPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    const programs = await getPrograms();
    const programId = (searchParams.programId as string) || (programs.length > 0 ? programs[0].id : "");

    const holidays = await getHolidays(programId);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold dark:text-white">Holiday Calendar</h1>
                {/* Program Selector could go here if multiple programs */}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add Holiday</h2>
                    <AddHolidayForm programId={programId} />
                </div>
                <div>
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Existing Holidays</h2>
                    <HolidayList holidays={holidays} />
                </div>
            </div>
        </div>
    );
}
