
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const GEMINI_KEY = process.env.GOOGLE_AI_KEY || process.env.VITE_GEMINI_API_KEY;

if (!GEMINI_KEY) {
    console.error("❌ No Google AI Key found in .env");
    process.exit(1);
}

// Config
const BATCH_SIZE = 5; // Process in small batches
const START_OFFSET = 0;

async function analyzeImage(imageUrl) {
    try {
        // Fetch image as base64
        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.statusText}`);
        const buf = await imgRes.arrayBuffer();
        const base64 = Buffer.from(buf).toString('base64');

        const prompt = `
            Analyze this product image. It contains embedded text with product details.
            Extract the following into a valid JSON object:
            - visible_price: The price visible on the image (e.g. "Rs 1995", "1350"). Return ONLY the number. Ignore "MUR" at the bottom if it looks generated, prioritize text that looks like a label/sticker on the clothing or image overlay.
            - visible_sizes: A list of sizes visible (e.g. ["S", "M", "L", "5XL"]).
            - visible_name: The product name if written on the image.
            
            If NO price or sizes are visible in the image itself (ignoring standard web UI elements if this is a screenshot), return null for those fields.
            Return ONLY JSON.
        `;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            { inline_data: { mime_type: 'image/jpeg', data: base64 } } // Assuming JPEG logic works for PNG too usually
                        ]
                    }]
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API Error: ${await response.text()}`);
        }

        const data = await response.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);

    } catch (e) {
        console.error(`Error analyzing ${imageUrl}:`, e.message);
        return null;
    }
}

async function runVisualUpdate() {
    console.log("🚀 Starting AI Visual Product Auditor...");

    // Get total count
    const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
    console.log(`Total Products: ${count}`);

    // Fetch batch (we can loop this later, testing with first batch)
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .range(START_OFFSET, START_OFFSET + BATCH_SIZE - 1)
        .order('id');

    if (error) {
        console.error("Supabase Error:", error);
        return;
    }

    console.log(`Processing batch of ${products.length} products...`);

    for (const product of products) {
        console.log(`\n-----------------------------------`);
        console.log(`📦 Inspecting: ${product.name} (ID: ${product.id})`);
        console.log(`   Current Price: ${product.price}`);
        console.log(`   Current Sizes: ${product.sizes}`);
        console.log(`   Image: ${product.image_url}`);

        if (!product.image_url) {
            console.log("   ❌ No image URL. Skipping.");
            continue;
        }

        const info = await analyzeImage(product.image_url);

        if (info) {
            console.log(`   🤖 AI Found:`, JSON.stringify(info));

            const updates = {};
            let needsUpdate = false;

            // Price Check
            if (info.visible_price && info.visible_price !== product.price) {
                console.log(`   💰 Price Mismatch: DB=${product.price} vs IMG=${info.visible_price}`);
                // Simple heuristic: If image has explicit price, trust it?
                // User said "Every pic has the price... please update"
                updates.price = info.visible_price;
                needsUpdate = true;
            }

            // Size Check
            if (info.visible_sizes && info.visible_sizes.length > 0) {
                // Compare arrays? simpler to just overwrite if user says "all pics have details"
                // But let's check if it's different
                const dbSizes = new Set(product.sizes || []);
                const imgSizes = new Set(info.visible_sizes);
                // If image has sizes the DB doesn't, OR DB is empty
                if (info.visible_sizes.length !== dbSizes.size || !info.visible_sizes.every(s => dbSizes.has(s))) {
                    console.log(`   📏 Size Update Needed: ${JSON.stringify(info.visible_sizes)}`);
                    updates.sizes = info.visible_sizes;
                    needsUpdate = true;
                }
            }

            if (needsUpdate) {
                console.log(`   📝 Applying Updates...`);
                // const { error: updateError } = await supabase.from('products').update(updates).eq('id', product.id);
                // if (updateError) console.error("   ❌ Update Failed:", updateError);
                // else console.log("   ✅ Product Updated!");
                console.log("   (Dry Run) Would update:", updates);
            } else {
                console.log("   ✅ No changes needed.");
            }

        } else {
            console.log("   ⚠️ Could not extract info / API failure.");
        }
    }
}

runVisualUpdate();
