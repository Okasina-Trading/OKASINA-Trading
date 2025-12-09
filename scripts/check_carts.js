
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    console.log('Checking for carts table...');
    const { data, error } = await supabase.from('carts').select('*').limit(1);
    if (error) {
        console.error('Error fetching carts:', error.message);
    } else {
        console.log('Carts table exists. Row count:', data.length);
    }
}

checkTable();
