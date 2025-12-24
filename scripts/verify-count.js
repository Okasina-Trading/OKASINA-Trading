
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env
dotenv.config();

// Manually load .env.local if it exists (since dotenv doesn't do cascading by default)
const localEnvPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(localEnvPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(localEnvPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log(`🔌 URL: ${supabaseUrl}`);
console.log(`🔑 Service Key: ${serviceKey ? 'FOUND' : 'MISSING'}`);
console.log(`🔑 Anon Key: ${anonKey ? 'FOUND' : 'MISSING'}`);

async function verify() {
    // 1. Check with Service Key (Admin)
    if (serviceKey) {
        console.log(`🔑 Service Key Length: ${serviceKey.length}`);
        const adminClient = createClient(supabaseUrl, serviceKey);
        const { count, error } = await adminClient.from('products').select('*', { count: 'exact', head: true });
        if (error) console.error(`❌ Admin Check Error:`, JSON.stringify(error, null, 2));
        else console.log(`✅ Admin Count: ${count}`);
    }

    // 2. Check with Anon Key (Public)
    if (anonKey) {
        const publicClient = createClient(supabaseUrl, anonKey);
        const { data, error } = await publicClient.from('products').select('sku, name, price, image_url').order('sku');
        if (error) console.error(`❌ Public Check Error:`, error);
        else {
            console.log(`👀 Public Data Found: ${data?.length} items`);
            fs.writeFileSync('current_products.json', JSON.stringify(data, null, 2));
            console.log("📄 Saved audit to current_products.json");

            // Quick Analysis
            const blanks = data.filter(p => !p.image_url);
            console.log(`⚠️ Products with NO IMAGE: ${blanks.length}`);
            if (blanks.length > 0) console.log(blanks.map(b => b.sku).join(', '));
        }
    }
    // 3. Raw REST Fetch (Bypass Client)
    if (anonKey) {
        console.log("🌍 Testing Raw REST API...");
        try {
            const res = await fetch(`${supabaseUrl}/rest/v1/products?select=count`, {
                headers: {
                    'apikey': anonKey,
                    'Authorization': `Bearer ${anonKey}`,
                    'Range': '0-0'
                }
            });
            console.log(`📡 Status: ${res.status} ${res.statusText}`);
            if (res.ok) {
                const text = await res.text();
                console.log(`📡 Body Length: ${text.length}`);
                console.log(`📦 Body Preview: ${text.substring(0, 200)}`);
                const contentRange = res.headers.get('content-range');
                console.log(`🔢 Content-Range: ${contentRange}`);
            } else {
                console.log(`❌ Body: ${await res.text()}`);
            }
        } catch (e) {
            console.error(`🔥 NETWORK ERROR: ${e.message}`);
        }
    }
}

verify();
