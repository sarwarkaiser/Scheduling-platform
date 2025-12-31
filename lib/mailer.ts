
import nodemailer from 'nodemailer';
import { env } from './env';

// Determine if we are in development mode to use mock/ethereal
const isDev = process.env.NODE_ENV === 'development';

export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Boolean(process.env.SMTP_SECURE) || false,
    auth: {
        user: process.env.SMTP_USER || 'ethereal_user',
        pass: process.env.SMTP_PASS || 'ethereal_pass',
    },
    // If no env vars are set, nodemailer might fail connection unless using a mock
});

export const sendMail = async (to: string, subject: string, html: string) => {
    if (process.env.MOCK_EMAIL === 'true') {
        console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`);
        return;
    }

    const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Scheduling Platform" <noreply@example.com>',
        to,
        subject,
        html,
    });

    if (isDev) {
        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }

    return info;
};
