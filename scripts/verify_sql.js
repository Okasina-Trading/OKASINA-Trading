
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase Credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking database schema...');

    // We can't query information_schema easily via client, but we can try to select user_id from orders
    // If it fails, column doesn't exist.

    // Attempt to select the column from the first order
    const { data, error } = await supabase
        .from('orders')
        .select('user_id')
        .limit(1);

    if (error && error.message.includes('does not exist')) {
        console.error('❌ CHECK FAILED: orders.user_id column is missing.');
        console.log('Action: Please run "supabase/migrations/20251216010000_loyalty_redemption.sql"');
        process.exit(1);
    } else if (error) {
        console.error('⚠️ Warning: Could not verify:', error.message);
    } else {
        console.log('✅ CHECK PASSED: orders.user_id column exists.');
    }

    // Check loyalty tables
    const { error: loyaltyError } = await supabase.from('loyalty_profiles').select('id').limit(1);
    if (loyaltyError) {
        console.error('❌ CHECK FAILED: loyalty_profiles table missing.');
    } else {
        console.log('✅ CHECK PASSED: loyalty_profiles exists.');
    }

    process.exit(0);
}

checkSchema();
