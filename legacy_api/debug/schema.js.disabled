import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');
    const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = process.env;
    if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY) {
        return res.status(500).json({ error: 'Missing Supabase env vars' });
    }
    const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);
    try {
        const { data, error } = await supabase
            .rpc('pg_table_def', { schema_name: 'public', table_name: 'products' })
            .select();
        // If RPC not available, fallback to raw SQL via supabase's query interface is not possible.
        if (error) throw error;
        return res.status(200).json({ columns: data });
    } catch (e) {
        return res.status(500).json({ error: e.message, details: e });
    }
}
