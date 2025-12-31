
import { mailQueue } from './queues/mail';

export const notifications = {
    async sendSchedulePublished(email: string, programName: string, link: string) {
        await mailQueue.add('schedule-published', {
            to: email,
            subject: `Schedule Published: ${programName}`,
            html: `
        <h1>New Schedule Published</h1>
        <p>The schedule for <strong>${programName}</strong> has been published.</p>
        <p><a href="${link}">Click here to view the schedule</a></p>
      `,
        });
    },

    async sendSwapRequest(targetEmail: string, requesterName: string, link: string) {
        await mailQueue.add('swap-request', {
            to: targetEmail,
            subject: `Swap Request from ${requesterName}`,
            html: `
        <h1>Swap Request</h1>
        <p><strong>${requesterName}</strong> has requested a shift swap with you.</p>
        <p><a href="${link}">Review Request</a></p>
      `,
        });
    },

    // Generic email
    async sendEmail(to: string, subject: string, html: string) {
        await mailQueue.add('generic', { to, subject, html });
    }
};
