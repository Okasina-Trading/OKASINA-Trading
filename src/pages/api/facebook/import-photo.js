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


        // 3. AI Analysis (Gemini)
        if (useAI) {
            try {
                const geminiKey = process.env.GOOGLE_AI_KEY || process.env.VITE_GEMINI_API_KEY;
                if (geminiKey) {
                    const aiRes = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{
                                    parts: [
                                        { text: `Analyze this image and the caption: "${caption}". Extract product details into JSON format: { "name": "Short catchy title", "description": "Detailed description", "category": "Category Name", "price": Number (if found, else 0), "tags": ["tag1", "tag2"] }. Rules: 1. If price is in caption (e.g. Rs 500), use it. 2. Category must be one of: 'Dresses', 'Tops', 'Bottoms', 'Bags', 'Accessories', 'Beauty'. 3. Description should be professional.` },
                                        {
                                            inline_data: {
                                                mime_type: 'image/jpeg',
                                                data: Buffer.from(buffer).toString('base64')
                                            }
                                        }
                                    ]
                                }]
                            })
                        }
                    );

                    const aiData = await aiRes.json();
                    const textResponse = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

                    if (textResponse) {
                        const jsonStr = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
                        const analysis = JSON.parse(jsonStr);

                        if (analysis.name) productName = analysis.name;
                        if (analysis.description) description = analysis.description;
                        if (analysis.category) category = analysis.category;
                        if (analysis.price) price = analysis.price;
                        // Tags could be stored if we had a tags column, usually in description for now
                    }
                }
            } catch (err) {
                console.error('AI Analysis Failed:', err);
                // Continue with defaults
            }
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
