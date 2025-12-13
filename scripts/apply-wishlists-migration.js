import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
    console.log('📦 Applying wishlists table migration...');

    const migrationPath = path.join(__dirname, '../supabase/migrations/002_create_wishlists.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    try {
        // Execute the SQL
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            // If exec_sql doesn't exist, try direct execution
            console.log('⚠️  exec_sql not available, attempting direct execution...');

            // Split by semicolons and execute each statement
            const statements = sql.split(';').filter(s => s.trim());

            for (const statement of statements) {
                if (statement.trim()) {
                    const { error: execError } = await supabase.rpc('exec', {
                        query: statement
                    });

                    if (execError) {
                        console.error('❌ Error executing statement:', execError);
                        console.log('Statement:', statement.substring(0, 100) + '...');
                    }
                }
            }
        }

        console.log('✅ Wishlists table migration applied successfully!');
        console.log('🔍 Verifying table exists...');

        // Verify the table was created
        const { data, error: checkError } = await supabase
            .from('wishlists')
            .select('*')
            .limit(1);

        if (checkError) {
            console.error('❌ Verification failed:', checkError.message);
            console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:');
            console.log(sql);
        } else {
            console.log('✅ Wishlists table verified and ready!');
        }

    } catch (err) {
        console.error('❌ Migration failed:', err);
        console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:');
        console.log(sql);
    }
}

applyMigration();
