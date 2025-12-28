import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load Environment Variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try resolving .env from CWD first (standard for npm scripts)
const envPath = path.resolve(process.cwd(), '.env');
console.log(`🔍 [Sentry] Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ? process.env.VITE_SUPABASE_URL.trim() : '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.trim() : '';

console.log(`🔍 [Sentry] Debug Check:`);
console.log(`   - URL Present: ${!!SUPABASE_URL}`);
console.log(`   - Key Present: ${!!SUPABASE_SERVICE_KEY}`);
console.log(`   - URL: ${SUPABASE_URL}`);

// FORCE ANON KEY for debugging purpose since Service Key is failing
const EFFECTIVE_KEY = process.env.VITE_SUPABASE_ANON_KEY ? process.env.VITE_SUPABASE_ANON_KEY.trim() : '';
console.log(`   - Using Key: ANON_KEY (Forced)`);

if (!SUPABASE_URL || !EFFECTIVE_KEY) {
    console.error('❌ [Sentry] Critical Error: Missing Environment Variables.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, EFFECTIVE_KEY);

async function runSentry() {
    console.log('🛡️ [Sentry] Starting Inventory Patrol...');

    try {
        // 1. Check for Negative Stock (Data Integrity Breach)
        const { data: negativeStock, error: negError } = await supabase
            .from('products')
            .select('id, name, stock_qty')
            .lt('stock_qty', 0);

        if (negError) throw negError;

        // 2. Check for Low Stock (Operational Warning)
        const { data: lowStock, error: lowError } = await supabase
            .from('products')
            .select('id, name, stock_qty')
            .lt('stock_qty', 5)
            .gte('stock_qty', 0); // Exclude negative ones already caught

        if (lowError) throw lowError;

        // REPORTING
        let criticalFound = false;

        if (negativeStock && negativeStock.length > 0) {
            console.error('\n🚨 [SENTRY ALERT] DATA INTEGRITY BREACH DETECTED!');
            console.error('   The following items have NEGATIVE stock levels:');
            negativeStock.forEach(item => {
                console.error(`   - [${item.id}] ${item.name}: ${item.stock_qty}`);
            });
            criticalFound = true;
        } else {
            console.log('✅ [Sentry] No negative stock detected. Integrity Secure.');
        }

        if (lowStock && lowStock.length > 0) {
            console.warn('\n⚠️ [Sentry Warning] Low Stock Alert (< 5 units):');
            lowStock.forEach(item => {
                console.warn(`   - ${item.name}: ${item.stock_qty} left`);
            });
        } else {
            console.log('✅ [Sentry] Healthy stock levels maintained.');
        }

        if (criticalFound) {
            console.error('\n❌ [Sentry] Patrol Finished. Critical Issues Found.');
            process.exit(1);
        } else {
            console.log('\n✅ [Sentry] Patrol Finished. All Clear.');
            process.exit(0);
        }

    } catch (error) {
        console.error('❌ [Sentry] Patrol Failed:', error.message);
        process.exit(1);
    }
}

runSentry();
