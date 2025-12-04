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
            .from('products')
            .select('*')
            .limit(1);
        if (error) throw error;
        if (!data || data.length === 0) {
            return res.status(200).json({ message: 'No products found', columns: [] });
        }
        const columns = Object.keys(data[0]);
        return res.status(200).json({ columns, sample: data[0] });
    } catch (e) {
        return res.status(500).json({ error: e.message, details: e });
    }
}
