import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Service Role Key appears to be invalid, so we use Anon Key which was verified to work.
// Note: This relies on exec_sql RPC being accessible to Anon/Authenticated users.
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function applyMigration() {
    const migrationFile = path.join(__dirname, '../supabase/migrations/004_fix_products_rls.sql');

    console.log(`📖 Reading migration file: ${migrationFile}`);

    try {
        const sql = fs.readFileSync(migrationFile, 'utf8');
        console.log('🚀 Applying migration...');

        const { error } = await supabase.rpc('exec_sql', { sql });

        if (error) {
            console.error('❌ Error applying migration:', error);
            process.exit(1);
        }

        console.log('✅ Migration applied successfully!');
    } catch (err) {
        console.error('❌ Unexpected error:', err);
        process.exit(1);
    }
}

applyMigration();
