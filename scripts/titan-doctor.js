import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load .env
const envPath = path.join(rootDir, '.env');
if (fs.existsSync(envPath)) {
    console.log(`Loading .env from ${envPath}`);
    dotenv.config({ path: envPath });
} else {
    console.warn('⚠️ .env file not found!');
}

async function runDoctor() {
    console.log('\n🩺 TITAN DOCTOR: System Health Check\n');
    let errors = 0;
    let warnings = 0;

    // 1. Environment Variables Check
    console.log('1️⃣  Environment Variables');
    const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];

    for (const key of requiredVars) {
        const val = process.env[key];
        if (!val) {
            console.error(`   ❌ Missing: ${key}`);
            errors++;
        } else {
            const trimmed = val.trim();
            if (trimmed.length !== val.length) {
                console.warn(`   ⚠️  Warning: ${key} has whitespace (Len: ${val.length}, Trimmed: ${trimmed.length})`);
                warnings++;
            }
            console.log(`   ✅ ${key}: Present (${val.length} chars)`);
        }
    }

    // 2. Connectivity Check
    console.log('\n2️⃣  Supabase Connectivity');
    try {
        const url = process.env.VITE_SUPABASE_URL?.trim();
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.VITE_SUPABASE_ANON_KEY?.trim();

        if (url && key) {
            const supabase = createClient(url, key);
            const { data, error } = await supabase.from('products').select('count').limit(1).single();

            if (error) {
                console.error(`   ❌ Connection Failed: ${error.message}`);
                errors++;
            } else {
                console.log(`   ✅ Connection Successful (Read Access)`);
            }
        } else {
            console.log('   ⏭️  Skipping connection check (Missing URL/Key)');
        }
    } catch (err) {
        console.error(`   ❌ Connection Exception: ${err.message}`);
        errors++;
    }

    // 3. File Integrity
    console.log('\n3️⃣  Critical Files');
    const criticalFiles = ['package.json', 'vite.config.js', 'src/App.jsx'];
    for (const file of criticalFiles) {
        if (fs.existsSync(path.join(rootDir, file))) {
            console.log(`   ✅ Found: ${file}`);
        } else {
            console.error(`   ❌ Missing: ${file}`);
            errors++;
        }
    }

    // Report
    console.log('\n----------------------------------------');
    if (errors > 0) {
        console.log(`❌ DIAGNOSIS: CRIMINAL HEALTH (Errors: ${errors}, Warnings: ${warnings})`);
        process.exit(1);
    } else if (warnings > 0) {
        console.log(`⚠️  DIAGNOSIS: STABLE WITH WARNINGS (Errors: 0, Warnings: ${warnings})`);
        process.exit(0);
    } else {
        console.log(`✅ DIAGNOSIS: EXCELLENT HEALTH`);
        process.exit(0);
    }
}

runDoctor();
