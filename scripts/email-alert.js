
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load .env from root
dotenv.config({ path: path.join(rootDir, '.env') });

const RECIPIENT_EMAIL = process.env.VITE_ALERT_RECIPIENT || process.env.VITE_SMTP_USER;

const transporter = nodemailer.createTransport({
    host: process.env.VITE_SMTP_HOST || 'smtpout.secureserver.net',
    port: Number(process.env.VITE_SMTP_PORT) || 465,
    secure: true,
    auth: {
        user: process.env.VITE_SMTP_USER,
        pass: process.env.VITE_SMTP_PASS,
    },
});

export const sendAlert = async (subject, message, isHtml = false) => {
    console.log(`📧 [Titan Uplink] Preparing alert: "${subject}" to ${RECIPIENT_EMAIL}`);

    if (!process.env.VITE_SMTP_USER || !process.env.VITE_SMTP_PASS) {
        console.warn('⚠️  [Titan Uplink] SMTP Credentials Missing. Email skipped.');
        console.log(`   Subject: ${subject}`);
        console.log(`   Body: ${message.substring(0, 100)}...`);
        return false;
    }

    try {
        const mailOptions = {
            from: `"${process.env.VITE_STORE_NAME || 'TITAN System'}" <${process.env.VITE_SMTP_USER}>`,
            to: RECIPIENT_EMAIL,
            subject: `🚨 TITAN ALERT: ${subject}`,
            [isHtml ? 'html' : 'text']: message,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ [Titan Uplink] Email Sent! ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('❌ [Titan Uplink] Failed to send email:', error.message);
        return false;
    }
};

// Allow CLI usage: node scripts/email-alert.js "Subject" "Message"
if (process.argv[1] === __filename) {
    const subject = process.argv[2] || 'Test Alert';
    const message = process.argv[3] || 'This is a test alert from the TITAN system.';
    sendAlert(subject, message);
}
