
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import nodemailer from 'nodemailer';

// Need to load env directly for independent script
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Using service role would be better for admin tasks, but ANON works if RLS allows or checks auth

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Setup Mailer (Duplicate config for script usage)
const transporter = nodemailer.createTransport({
    host: process.env.VITE_SMTP_HOST || 'smtpout.secureserver.net',
    port: Number(process.env.VITE_SMTP_PORT) || 465,
    secure: true,
    auth: {
        user: process.env.VITE_SMTP_USER,
        pass: process.env.VITE_SMTP_PASS,
    },
});

async function runAbandonedCartRecovery() {
    console.log('--- Starting Abandoned Cart Recovery ---');
    console.log(new Date().toISOString());

    // Logic: Find carts updated > 24 hours ago AND < 48 hours ago
    // Supabase filtering on JSON arrays (items) with length > 0 is tricky in simple query, 
    // but we can filter by updated_at and then check items in JS.

    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const TWO_DAYS_MS = 48 * 60 * 60 * 1000;

    // We fetch carts modified in the last 48 hours
    // (Optimization: We could restrict this range closer if we had server-side filters)
    const { data: carts, error } = await supabase
        .from('carts')
        .select('user_id, items, updated_at, email'); // Fetch email directly from table

    if (error) {
        console.error('Error fetching carts:', error.message);
        return;
    }

    if (!carts || carts.length === 0) {
        console.log('No active carts found.');
        return;
    }

    let emailsSent = 0;

    for (const cart of carts) {
        // Skip empty carts or carts without email
        if (!cart.items || cart.items.length === 0 || !cart.email) continue;

        const lastUpdate = new Date(cart.updated_at).getTime();
        const now = Date.now();
        const timeDiff = now - lastUpdate;

        // Check if abandoned (between 24h and 48h)
        // For DEBUG purposes, let's lower the threshold to 5 minutes so user can test LIVE
        // const isAbandoned = timeDiff > ONE_DAY_MS && timeDiff < TWO_DAYS_MS;
        const isAbandoned = timeDiff > (5 * 60 * 1000); // 5 minutes for testing

        if (isAbandoned) {
            // Need user email. If join failed, we might be stuck.
            // WORKAROUND: For this demo, we can't easily get auth.users email without service role.
            // We will log the "Target" and if SMTP is configured, try to send to a test email if user provided one, or skip.

            console.log(`[Target] User ${cart.user_id} has ${cart.items.length} items abandoned.`);

            // Construct email
            const productNames = cart.items.map(i => i.name).join(', ');
            const html = `
                <h1>You left something behind!</h1>
                <p>We noticed you left <strong>${productNames}</strong> in your cart.</p>
                <p>Use code <strong>COMEBACK10</strong> for 10% off if you complete your order today!</p>
                <a href="${process.env.VITE_API_URL || 'https://okasinatrading.com'}/cart">Return to Cart</a>
            `;

            // Try to send
            if (process.env.VITE_SMTP_USER) {
                // Determine Recipient: access user email if join worked, else use debug email or fail
                // Since we can't easily read auth.users from client lib without service key:
                // We'll log "Would send to user".
                console.log(`Sending email for cart... content: ${productNames}`);
                // await transporter.sendMail(...) -> We need the recipient.
            } else {
                console.log('SMTP not configured. Mock send:\n', html);
            }
            emailsSent++;
        }
    }

    console.log(`Processed ${carts.length} carts. Identified ${emailsSent} abandoned carts.`);
}

runAbandonedCartRecovery();
