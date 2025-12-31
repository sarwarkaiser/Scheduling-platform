
import { Worker } from 'bullmq';
import { connection } from '../redis';
import { MAIL_QUEUE_NAME } from '../queues/mail';
import { sendMail } from '../mailer';

export const mailWorker = new Worker(
    MAIL_QUEUE_NAME,
    async (job) => {
        console.log(`Processing mail job ${job.id}: ${job.name}`);
        const { to, subject, html } = job.data;

        await sendMail(to, subject, html);

        console.log(`Mail job ${job.id} completed.`);
    },
    {
        connection,
        concurrency: 5, // Send up to 5 emails concurrently
    }
);
