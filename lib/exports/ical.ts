
import ical, { ICalCalendar } from 'ical-generator';

export interface ExportAssignment {
    id?: string;
    date: Date;
    startTime: Date;
    endTime: Date;
    residentName: string;
    role: string;
    siteName: string;
    serviceName: string;
}

export function generateScheduleICal(programName: string, assignments: ExportAssignment[]): ICalCalendar {
    const calendar = ical({ name: `${programName} Schedule` });

    for (const assignment of assignments) {
        calendar.createEvent({
            start: assignment.startTime,
            end: assignment.endTime,
            summary: `${assignment.role} - ${assignment.residentName}`,
            description: `Service: ${assignment.serviceName}\nSite: ${assignment.siteName}`,
            location: assignment.siteName,
        });
    }

    return calendar;
}
