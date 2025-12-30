
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, '.env') });

const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(process.env.VITE_SUPABASE_URL, key);

async function checkBanner() {
    console.log("🔍 Checking 'flash_sale' setting in 'site_settings' table...");
    const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'flash_sale')
        .single();

    if (error) {
        console.error("❌ DB Error:", error.message);
    } else {
        console.log("✅ Data Found:");
        console.log(JSON.stringify(data.value, null, 2));

        if (data.value && data.value.is_active) {
            console.log("👉 Banner is ACTIVE in DB. Use Sentinel to verifying rendering.");
        } else {
            console.log("👉 Banner is INACTIVE in DB. It will NOT render.");
        }
    }
}

checkBanner();
