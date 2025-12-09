
import nodemailer from 'nodemailer';
import { logger } from '../services/logger.js';

// Create a transporter using GoDaddy SMTP (or generic SMTP)
// User needs to add these to .env
const transporter = nodemailer.createTransport({
    host: import.meta.env.VITE_SMTP_HOST || 'smtpout.secureserver.net',
    port: Number(import.meta.env.VITE_SMTP_PORT) || 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: import.meta.env.VITE_SMTP_USER,
        pass: import.meta.env.VITE_SMTP_PASS,
    },
});

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email body (HTML)
 */
export const sendEmail = async (to, subject, html) => {
    try {
        if (!import.meta.env.VITE_SMTP_USER) {
            console.warn('[Email] SMTP credentials missing. Logging email instead.');
            console.log(`To: ${to}\nSubject: ${subject}\nBody: ${html.substring(0, 100)}...`);
            return { success: true, mocked: true };
        }

        const info = await transporter.sendMail({
            from: `"${import.meta.env.VITE_STORE_NAME || 'Okasina Admin'}" <${import.meta.env.VITE_SMTP_USER}>`,
            to,
            subject,
            html,
        });

        console.log('Message sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        logger.error('Failed to send email', { error, to, subject });
        console.error('Email Send Error:', error);
        return { success: false, error };
    }
};
