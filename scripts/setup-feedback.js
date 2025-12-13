
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupFeedbackTable() {
    console.log('Checking/Creating "jarvis_feedback" table...');

    // 1. Create Table via SQL (RPC or Direct if allowed, usually direct SQL needed for schema)
    // Since we can't easily run DDL via JS client without specific privileges or RPC,
    // we will try to use the 'rpc' method if a helper exists, OR fallback to console log instruction.

    // HOWEVER, for this "fix", we will assume we can't run raw SQL easily via JS client 
    // unless we have a 'exec_sql' function. 
    // We will attempt to just insert a row to see if it exists, if error is "relation does not exist", we know we need to create it.

    const { error } = await supabase
        .from('jarvis_feedback')
        .select('*')
        .limit(1);

    if (error && error.code === '42P01') { // undefined_table
        console.log('Table "jarvis_feedback" does not exist.');
        console.log('PLEASE RUN THE FOLLOWING SQL IN SUPABASE DASHBOARD:');
        console.log(`
            CREATE TABLE IF NOT EXISTS jarvis_feedback (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
                type TEXT NOT NULL DEFAULT 'bug',
                message TEXT NOT NULL,
                url TEXT,
                path TEXT,
                user_agent TEXT,
                status TEXT DEFAULT 'open',
                resolution_notes TEXT
            );
            
            -- Enable RLS
            ALTER TABLE jarvis_feedback ENABLE ROW LEVEL SECURITY;
            
            -- Policy: Anyone can insert (anon)
            CREATE POLICY "Allow Anon Insert" ON jarvis_feedback FOR INSERT 
            WITH CHECK (true);
            
            -- Policy: Only Service Role can select/update (or authenticated admins)
            CREATE POLICY "Allow Service Select" ON jarvis_feedback FOR SELECT 
            USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
        `);
    } else if (!error) {
        console.log('Table "jarvis_feedback" exists. Good to go.');
    } else {
        console.error('Error checking table:', error);
    }
}

setupFeedbackTable();
