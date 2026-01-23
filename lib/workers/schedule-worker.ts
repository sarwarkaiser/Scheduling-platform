
import { Worker } from 'bullmq';
import { connection } from '../redis';
import { SCHEDULE_QUEUE_NAME } from '../queues/schedules';
import { SchedulingEngine } from '../modules/scheduling/engine';
import { prisma } from '../prisma';

const worker = new Worker(
    SCHEDULE_QUEUE_NAME,
    async (job) => {
        console.log(`Processing job ${job.id} for program ${job.data.programId}`);

        // Update progress
        await job.updateProgress(10);

        const engine = new SchedulingEngine();

        // Run generation (this is the heavy lifting)
        const result = await engine.generateSchedule({
            programId: job.data.programId,
            startDate: new Date(job.data.startDate),
            endDate: new Date(job.data.endDate),
            callPoolIds: job.data.callPoolIds,
            siteIds: job.data.siteIds,
        });

        await job.updateProgress(80);

        const missingSiteIds = result.shiftInstances
            .filter(si => !si.siteId)
            .map(si => si.shiftTemplateId);

        if (missingSiteIds.length > 0) {
            throw new Error(
                `Schedule generation failed: missing site for templates: ${Array.from(new Set(missingSiteIds)).join(", ")}`
            );
        }

        // Save Logic (Copied/Refactored from API)
        // Ideally this persistence logic should be in the engine or a service, 
        // but for now we'll put it here to keep the engine pure calculation if possible,
        // though the previous API implementation had persistence mixed in.
        // Let's reuse the persistence logic.
        // Actually, looking at the previous API route, the persistence was IN the route.
        // We should move that persistence logic to a reusable place. 
        // For now, I will implement a basic persistence here to complete the flow.

        await prisma.$transaction(async (tx) => {
            // 1. Clear existing assignments
            await tx.assignment.deleteMany({
                where: {
                    shiftInstance: {
                        shiftTemplate: { programId: job.data.programId },
                        date: {
                            gte: new Date(job.data.startDate),
                            lte: new Date(job.data.endDate),
                        },
                    },
                },
            });

            // 2. Save shift instances
            const shiftInstanceIdMap = new Map<string, string>();
            for (const si of result.shiftInstances) {
                const created = await tx.shiftInstance.upsert({
                    where: {
                        shiftTemplateId_date: {
                            shiftTemplateId: si.shiftTemplateId,
                            date: new Date(si.date)
                        }
                    },
                    update: {
                        startTime: new Date(si.startTime),
                        endTime: new Date(si.endTime),
                        siteId: si.siteId,
                    },
                    create: {
                        shiftTemplateId: si.shiftTemplateId,
                        date: new Date(si.date),
                        startTime: new Date(si.startTime),
                        endTime: new Date(si.endTime),
                        siteId: si.siteId,
                        status: 'published', // Or Draft? Let's default to published for now based on logic
                    }
                });
                shiftInstanceIdMap.set(si.id, created.id);
            }

            // 3. Save Assignments
            for (const assignment of result.assignments) {
                const dbShiftInstanceId = shiftInstanceIdMap.get(assignment.shiftInstanceId);
                if (!dbShiftInstanceId) continue;

                await tx.assignment.create({
                    data: {
                        shiftInstanceId: dbShiftInstanceId,
                        residentId: assignment.residentId,
                        role: assignment.role,
                        status: 'PUBLISHED',
                        siteId: assignment.siteId,
                    }
                });
            }
        });

        await job.updateProgress(100);
        return {
            assignments: result.assignments.length,
            shiftInstances: result.shiftInstances.length
        };
    },
    { connection }
);

// Graceful shutdown
process.on('SIGTERM', async () => {
    await worker.close();
});

export default worker;
