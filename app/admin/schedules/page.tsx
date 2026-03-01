import { getPrograms } from "@/app/actions/programs";
import { getSchedule } from "@/app/actions/schedule";
import ScheduleViewer from "@/components/admin/schedules/ScheduleViewer";
import NotifyButton from "@/components/admin/schedules/NotifyButton";

export default async function SchedulesPage() {
    const programs = await getPrograms();
    const defaultProgram = programs[0];

    let initialEvents: any[] = [];

    if (defaultProgram) {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
        initialEvents = await getSchedule(defaultProgram.id, start.toISOString(), end.toISOString());
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold dark:text-white">Schedule</h1>
                {defaultProgram && <NotifyButton programId={defaultProgram.id} />}
            </div>
            {programs.length > 0 ? (
                <ScheduleViewer initialEvents={initialEvents} programs={programs} />
            ) : (
                <div className="text-gray-500">Please create a program first.</div>
            )}
        </div>
    );
}
