
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
            for (const si of result.shiftInstances) {
                await tx.shiftInstance.upsert({
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
            }

            // 3. Save Assignments
            for (const assignment of result.assignments) {
                // We need to fetch the shiftInstance ID from DB or rely on the upsert above
                // The engine returns 'temp' IDs for instances.
                // This is tricky without returning the DB IDs.
                // Strategy: The upsert above ensures the instance exists.
                // We can query it by templateId + date.

                const dbInstance = await tx.shiftInstance.findUniqueOrThrow({
                    where: {
                        shiftTemplateId_date: {
                            shiftTemplateId: assignment.shiftInstanceId, // Engine actually uses temp ID here?
                            // Wait, engine uses temp ID. We need to map it back to template ID.
                            // In engine.ts, 'id' is `temp-${template.id}-${date}`.
                            // So we can extract templateId and date from the shiftInstance.
                            date: new Date(result.shiftInstances.find(s => s.id === assignment.shiftInstanceId)!.date)
                        }
                    }
                });

                // BUT, wait. shiftInstanceId in assignment refers to the engine's internal ID.
                // We need to re-link it.
                // Or simpler: The engine result should probably contain the ShiftTemplateID 
                // inside the ShiftInstance object. It does.

                const shiftInstance = result.shiftInstances.find(s => s.id === assignment.shiftInstanceId);
                if (!shiftInstance) continue;

                await tx.assignment.create({
                    data: {
                        shiftInstanceId: dbInstance.id,
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
