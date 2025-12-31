import { getPrograms } from "@/app/actions/programs";
import { getSchedule } from "@/app/actions/schedule";
import ScheduleViewer from "@/components/admin/schedules/ScheduleViewer";

export default async function SchedulesPage() {
    const programs = await getPrograms();
    const defaultProgram = programs[0];

    let initialEvents: any[] = [];

    if (defaultProgram) {
        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setDate(today.getDate() + 30);

        initialEvents = await getSchedule(
            defaultProgram.id,
            today.toISOString(),
            nextMonth.toISOString()
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold dark:text-white">Schedule Viewer</h1>
            {programs.length > 0 ? (
                <ScheduleViewer initialEvents={initialEvents} programs={programs} />
            ) : (
                <div>Please create a program first.</div>
            )}
        </div>
    );
}
