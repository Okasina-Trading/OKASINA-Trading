import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { productIds, category } = req.body;
        console.log(`Updating ${productIds.length} products to category: ${category}`);

        const { data, error } = await supabase
            .from('products')
            .update({ category })
            .in('id', productIds)
            .select();

        if (error) throw error;

        return res.status(200).json({
            success: true,
            message: `Successfully updated ${data.length} products`,
            count: data.length
        });
    } catch (error) {
        console.error('Error updating categories:', error);
        return res.status(500).json({ error: error.message });
    }
}
