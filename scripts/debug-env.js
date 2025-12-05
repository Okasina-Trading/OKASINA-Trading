import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '../.env');

dotenv.config({ path: envPath });

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('URL:', url);

async function testKey(name, key) {
    if (!key) {
        console.log(`❌ ${name} is missing`);
        return;
    }
    console.log(`Testing ${name}...`);
    const supabase = createClient(url, key);
    const { data, error } = await supabase.from('products').select('count', { count: 'exact', head: true });

    if (error) {
        console.log(`❌ ${name} failed:`, error.message);
    } else {
        console.log(`✅ ${name} works!`);
    }
}

(async () => {
    await testKey('Service Role Key', serviceKey);
    await testKey('Anon Key', anonKey);
})();
