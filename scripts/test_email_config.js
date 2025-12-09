
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function verifySmtp() {
    console.log('--- Verifying SMTP Configuration ---');

    if (!process.env.VITE_SMTP_USER || !process.env.VITE_SMTP_PASS) {
        console.error('❌ Missing VITE_SMTP_USER or VITE_SMTP_PASS in .env');
        process.exit(1);
    }

    const transporter = nodemailer.createTransport({
        host: process.env.VITE_SMTP_HOST || 'smtpout.secureserver.net',
        port: Number(process.env.VITE_SMTP_PORT) || 465,
        secure: true,
        auth: {
            user: process.env.VITE_SMTP_USER,
            pass: process.env.VITE_SMTP_PASS,
        },
    });

    try {
        await transporter.verify();
        console.log('✅ SMTP Connection Successful!');
        console.log('   Host:', process.env.VITE_SMTP_HOST);
        console.log('   User:', process.env.VITE_SMTP_USER);

        // Optional: Send a test email to self
        /*
        const info = await transporter.sendMail({
            from: process.env.VITE_SMTP_USER,
            to: process.env.VITE_SMTP_USER,
            subject: 'Test Email from Okasina Admin',
            text: 'If you see this, your email configuration is working perfectly!',
        });
        console.log('✅ Test email sent:', info.messageId);
        */

    } catch (error) {
        console.error('❌ SMTP Connection Failed:', error);
    }
}

verifySmtp();
