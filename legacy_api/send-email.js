import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    // 1. CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // 2. Handle OPTIONS (Preflight)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { to, subject, html } = req.body;

    // Get SMTP Credentials from Environment Variables
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        return res.status(500).json({ error: 'Missing SMTP Configuration' });
    }

    try {
        // Create Transporter
        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT) || 465,
            secure: Number(SMTP_PORT) === 465, // true for 465, false for other ports
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS,
            },
        });

        // Send Email
        const info = await transporter.sendMail({
            from: `"Okasina Fashion" <${SMTP_USER}>`, // Sender address
            to: to, // List of receivers
            subject: subject, // Subject line
            html: html, // HTML body
        });

        console.log('Message sent: %s', info.messageId);
        return res.status(200).json({ success: true, messageId: info.messageId });

    } catch (error) {
        console.error('Email Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
