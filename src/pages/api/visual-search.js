import { createClient } from '@supabase/supabase-js';

// Init Supabase (Server Side)
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { imageBase64 } = req.body;

    if (!imageBase64) {
        return res.status(400).json({ error: 'Missing image data' });
    }

    try {
        // 1. Call Gemini Vision API to analyze image
        const geminiKey = process.env.GOOGLE_AI_KEY || process.env.VITE_GEMINI_API_KEY;

        if (!geminiKey) {
            return res.status(500).json({ error: 'AI Service Config Error (Missing Key)' });
        }

        const aiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: "Analyze this fashion item. Return a JSON object with fields: 'category' (e.g. Dress, Shirt, Bag), 'color' (e.g. Red, Blue), 'gender' (Men, Women), 'style' (e.g. Casual, Formal), and 'searchTerms' (array of 3 keywords for search). Output ONLY JSON." },
                            {
                                inline_data: {
                                    mime_type: 'image/jpeg',
                                    data: imageBase64.split(',')[1] || imageBase64 // Strip header if present
                                }
                            }
                        ]
                    }]
                })
            }
        );

        const aiData = await aiRes.json();

        if (!aiData.candidates || !aiData.candidates[0].content) {
            throw new Error('AI analysis failed to return content');
        }

        const textResponse = aiData.candidates[0].content.parts[0].text;

        // Clean markdown from response validation
        const jsonStr = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        let analysis;
        try {
            analysis = JSON.parse(jsonStr);
        } catch (e) {
            console.error('JSON Parse Error', textResponse);
            // Fallback
            analysis = { searchTerms: ['New Arrival'], category: 'Fashion' };
        }

        console.log('Visual Search Terms:', analysis);

        // 2. Search Supabase using extracted terms
        // We construct a text search string
        const searchString = [
            analysis.color,
            analysis.category,
            ...analysis.searchTerms
        ].join(' OR ');

        // Use Supabase text search on columns
        const { data: products, error } = await supabase
            .from('products')
            .select('id, name, price, price_mur, image_url, category')
            .textSearch('name', `'${analysis.category}' | '${analysis.color}'`) // Simple full text search
            .limit(10);

        // If simple search fails, try ILIKE
        let finalResults = products || [];
        if (finalResults.length === 0) {
            const { data: fallback } = await supabase
                .from('products')
                .select('id, name, price, price_mur, image_url, category')
                .or(`name.ilike.%${analysis.category}%,description.ilike.%${analysis.category}%`)
                .limit(10);
            finalResults = fallback || [];
        }

        return res.status(200).json({
            success: true,
            analysis: analysis,
            products: finalResults
        });

    } catch (error) {
        console.error('Visual Search Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
