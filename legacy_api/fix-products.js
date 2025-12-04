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
        // 1. Update status to active
        const { data: updatedData, error: updateError, count } = await supabase
            .from('products')
            .update({ status: 'active' })
            .eq('status', 'draft')
            .select();

        if (updateError) throw updateError;

        // 2. Check for products with missing images/prices
        const { data: badProducts, error: checkError } = await supabase
            .from('products')
            .select('id, name, price, price_mur, image_url')
            .or('price_mur.is.null,image_url.is.null')
            .eq('status', 'active');

        res.status(200).json({
            message: 'Update executed',
            updatedCount: updatedData.length,
            badProductsCount: badProducts?.length || 0,
            badProductsSample: badProducts?.slice(0, 5),
            env: {
                hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY,
                projectRef: VITE_SUPABASE_URL?.split('.')[0].split('//')[1]
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
