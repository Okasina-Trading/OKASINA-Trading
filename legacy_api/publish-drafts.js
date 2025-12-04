import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const {
        VITE_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        VITE_SUPABASE_ANON_KEY
    } = process.env;

    // Use Service Role Key to bypass RLS
    const supabaseKey = SUPABASE_SERVICE_ROLE_KEY || VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(VITE_SUPABASE_URL, supabaseKey);

    try {
        // Update all draft products to active
        const { data, error, count } = await supabase
            .from('products')
            .update({ status: 'active' })
            .eq('status', 'draft')
            .select();

        if (error) throw error;

        // Get final counts
        const { count: activeCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        res.status(200).json({
            message: 'Products published successfully',
            publishedCount: data?.length || 0,
            totalActiveProducts: activeCount,
            hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
