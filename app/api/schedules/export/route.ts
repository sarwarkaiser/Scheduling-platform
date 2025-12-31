
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateScheduleCSV } from '@/lib/exports/csv';
import { generateScheduleICal } from '@/lib/exports/ical';
import { z } from 'zod';
import { handleAPIError } from '@/lib/api-handler';

// Validation Schema
const exportSchema = z.object({
    programId: z.string(),
    startDate: z.string().transform(str => new Date(str)),
    endDate: z.string().transform(str => new Date(str)),
    format: z.enum(['csv', 'ics']),
});

export async function GET(req: NextRequest) {
    try {
        const searchParams = Object.fromEntries(req.nextUrl.searchParams);

        // Validate inputs
        const { programId, startDate, endDate, format } = exportSchema.parse(searchParams);

        // Fetch Program (for filename)
        const program = await prisma.program.findUniqueOrThrow({
            where: { id: programId },
            select: { name: true }
        });

        // Fetch Assignments
        const assignments = await prisma.assignment.findMany({
            where: {
                shiftInstance: {
                    shiftTemplate: { programId },
                    date: { gte: startDate, lte: endDate },
                },
            },
            include: {
                resident: {
                    include: { user: { select: { name: true } } }
                },
                shiftInstance: {
                    include: {
                        site: { select: { name: true } },
                        shiftTemplate: {
                            include: {
                                service: { select: { name: true } }
                            }
                        }
                    }
                }
            },
            orderBy: { shiftInstance: { date: 'asc' } }
        });

        // Transform Data
        const exportData = assignments.map(a => ({
            date: a.shiftInstance.date,
            startTime: a.shiftInstance.startTime,
            endTime: a.shiftInstance.endTime,
            residentName: a.resident.user?.name || 'Unknown Resident',
            role: a.role,
            siteName: a.shiftInstance.site?.name || 'Unknown Site',
            serviceName: a.shiftInstance.shiftTemplate.service?.name || 'Unknown Service',
        }));

        // Generate File
        if (format === 'csv') {
            const csv = await generateScheduleCSV(exportData);
            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="${program.name}_Schedule.csv"`,
                },
            });
        } else {
            const calendar = generateScheduleICal(program.name, exportData);
            return new NextResponse(calendar.toString(), {
                headers: {
                    'Content-Type': 'text/calendar; charset=utf-8',
                    'Content-Disposition': `attachment; filename="${program.name}_Schedule.ics"`,
                },
            });
        }

    } catch (error) {
        return handleAPIError(error);
    }
}
