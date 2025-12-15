import { supabase } from '../../../supabase';

export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { id, url, caption, customName, useAI } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'Missing image URL' });
    }

    try {
        // 1. Download Image from Facebook
        const imgRes = await fetch(url);
        if (!imgRes.ok) throw new Error(`Failed to download image from FB: ${imgRes.statusTxt}`);
        const buffer = await imgRes.arrayBuffer();

        // 2. Upload to Supabase Storage
        const filename = `fb-${id}-${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('product-images')
            .upload(filename, buffer, {
                contentType: 'image/jpeg',
                upsert: false
            });

        if (uploadError) throw new Error(`Supabase Upload Error: ${uploadError.message}`);

        // Get Public URL
        const { data: publicData } = supabase
            .storage
            .from('product-images')
            .getPublicUrl(filename);

        const publicUrl = publicData.publicUrl;

        // 3. Create Product Record (Draft)
        // Default values
        let productName = customName || caption || `Imported Item ${id.substring(0, 5)}`;
        // Truncate name if too long
        productName = productName.substring(0, 100);

        let description = caption || 'Imported from Facebook';
        let category = 'Uncategorized';
        let price = 0;

        // AI Placeholder (Future expansion: Call local Ollama or OpenAI here)
        if (useAI) {
            // Logic to call AI service would go here
            // For now, we use simple heuristics or defaults
            if (caption && caption.toLowerCase().includes('dress')) category = 'Clothing';
            if (caption && caption.toLowerCase().includes('bag')) category = 'Bags';
        }

        const { data: product, error: dbError } = await supabase
            .from('products')
            .insert([{
                name: productName,
                description: description,
                category: category,
                price: price,
                image_url: publicUrl,
                status: 'draft', // Always draft for safety
                stock_qty: 0,
                sku: `FB-${id}`
            }])
            .select()
            .single();

        if (dbError) throw new Error(`Database Insert Error: ${dbError.message}`);

        return res.status(200).json({
            success: true,
            product: product
        });

    } catch (e) {
        console.error('Import Photo Error:', e);
        return res.status(500).json({ error: e.message });
    }
}
