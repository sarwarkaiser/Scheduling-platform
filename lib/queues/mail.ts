
import { Queue } from 'bullmq';
import { connection } from '../redis';

export const MAIL_QUEUE_NAME = 'mail';

export const mailQueue = new Queue(MAIL_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: {
            age: 7 * 24 * 3600 // 7 days
        }
    },
});
