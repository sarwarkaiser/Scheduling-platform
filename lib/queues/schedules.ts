
import { Queue } from 'bullmq';
import { connection } from '../redis';

export const SCHEDULE_QUEUE_NAME = 'schedules';

export const scheduleQueue = new Queue(SCHEDULE_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: {
            age: 24 * 3600, // Keep for 24 hours
            count: 100,
        },
        removeOnFail: {
            age: 7 * 24 * 3600, // Keep failed jobs longer for debugging
        },
    },
});
