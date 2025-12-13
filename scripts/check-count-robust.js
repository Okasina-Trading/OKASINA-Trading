
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Checking URL:', url ? 'FOUND' : 'MISSING');
console.log('Checking Key:', key ? 'FOUND' : 'MISSING');

if (!url || !key) {
    console.error('Missing credentials!');
    process.exit(1);
}

const supabase = createClient(
    String(url).trim(),
    String(key).trim(),
    { auth: { persistSession: false } }
);

async function check() {
    try {
        console.log('Connecting to Supabase...');
        const { count, error } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('Supabase Error:', JSON.stringify(error, null, 2));
        } else {
            console.log('✅ CURRENT PRODUCT COUNT:', count);
        }
    } catch (err) {
        console.error('Fatal Error:', err);
    }
}
check();
