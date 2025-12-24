
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log(`URL: ${url}`);
console.log(`Key (Service): ${key ? key.substring(0, 10) + '...' : 'Missing'}`);
console.log(`Key (Anon): ${anonKey ? anonKey.substring(0, 10) + '...' : 'Missing'}`);

async function testConnection(k, type) {
    console.log(`\nTesting ${type} key...`);
    const sb = createClient(url, k);
    const { data, error } = await sb.from('products').select('id').limit(1);
    if (error) console.error(`❌ Error: ${error.message}`);
    else console.log(`✅ Success! Found ${data.length} items.`);
}

(async () => {
    if (key) await testConnection(key, 'SERVICE');
    if (anonKey) await testConnection(anonKey, 'ANON');
})();
