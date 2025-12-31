
import { createObjectCsvStringifier } from 'csv-writer';

export interface ExportAssignment {
    date: Date;
    startTime: Date;
    endTime: Date;
    residentName: string;
    role: string;
    siteName: string;
    serviceName: string;
}

export async function generateScheduleCSV(assignments: ExportAssignment[]): Promise<string> {
    const csvStringifier = createObjectCsvStringifier({
        header: [
            { id: 'date', title: 'Date' },
            { id: 'startTime', title: 'Start Time' },
            { id: 'endTime', title: 'End Time' },
            { id: 'residentName', title: 'Resident' },
            { id: 'role', title: 'Role' },
            { id: 'siteName', title: 'Site' },
            { id: 'serviceName', title: 'Service' },
        ],
    });

    const records = assignments.map(a => ({
        ...a,
        date: new Date(a.date).toLocaleDateString(),
        startTime: new Date(a.startTime).toLocaleTimeString(),
        endTime: new Date(a.endTime).toLocaleTimeString(),
    }));

    return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
}
