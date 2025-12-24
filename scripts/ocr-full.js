
import { createClient } from '@supabase/supabase-js';
import Tesseract from 'tesseract.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Config
const IMAGE_DIR = String.raw`C:\Users\ICL  ZAMBIA\Desktop\okasina-fashion-store-vite\Website imports\Website import`;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log("🔌 Auto-Correction URL:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function extractDetails(text) {
    const changes = {};
    const normText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ');

    // 1. PRICE Extraction
    // Look for Rs, MUR, Price
    const priceMatch = normText.match(/(?:Rs\.?|MUR|Price:?)\s*(\d{3,5})/i);
    // Safety: Only accept price if > 100 (avoids capturing "Size 12")
    if (priceMatch) {
        const p = parseInt(priceMatch[1]);
        if (p > 100) changes.price = p;
    }

    // 2. SIZE Extraction
    // Look for S/M/L/XL/XXL/3XL...10XL
    const foundSizes = new Set();

    // Pattern: XS, S, M, L, XL, XXL, XXXL
    const standardMatch = normText.match(/\b(XS|S|M|L|XL|XXL|XXXL)\b/gi);
    if (standardMatch) standardMatch.forEach(s => foundSizes.add(s.toUpperCase()));

    // Pattern: 2XL, 3XL ... 10XL
    const numberXLMatch = normText.match(/\b(\d+)XL\b/gi);
    if (numberXLMatch) numberXLMatch.forEach(s => foundSizes.add(s.toUpperCase()));

    // FREE SIZE
    if (/free\s*size/i.test(normText)) foundSizes.add('Free Size');

    if (foundSizes.size > 0) {
        // Sort sizes logically? Hard. Just valid array.
        // Custom sort: S < M < L < XL < 2XL < ...
        const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL', '8XL', '9XL', '10XL', 'Free Size'];
        changes.sizes = Array.from(foundSizes).sort((a, b) => order.indexOf(a) - order.indexOf(b));
    }

    return changes;
}

async function runOCR() {
    console.log("🚀 Starting Full AI Extraction (Price + Sizes)...");

    const { data: products, error } = await supabase
        .from('products')
        .select('id, sku, price, sizes, image_url');

    if (error) { console.error("❌ DB Error:", error.message); return; }

    console.log(`📊 Scanning ${products.length} products...`);
    let updatedCount = 0;

    for (const product of products) {
        if (!product.sku) continue;

        // Find match
        const fileNames = [
            `${product.sku}.jpg`, `${product.sku}.jpeg`, `${product.sku}.png`,
            `${product.sku.toUpperCase()}.jpg` // case insensitive fallback
        ];

        // Find existing file
        // We iterate dir to find case-insensitive match
        let localPath = null;
        if (fs.existsSync(IMAGE_DIR)) {
            const files = fs.readdirSync(IMAGE_DIR);
            const match = files.find(f => fileNames.some(n => n.toLowerCase() === f.toLowerCase()));
            if (match) localPath = path.join(IMAGE_DIR, match);
        }

        if (!localPath) {
            process.stdout.write('x');
            continue;
        }

        process.stdout.write('.'); // Progress dot

        try {
            const { data: { text } } = await Tesseract.recognize(localPath, 'eng', {
                logger: m => { } // silent
            });

            const updates = await extractDetails(text);
            const toUpdate = {};

            // Apply Price Update
            if (updates.price && updates.price !== product.price) {
                console.log(`\n💰 ${product.sku}: Price ${product.price} -> ${updates.price}`);
                toUpdate.price = updates.price;
            }

            // Apply Size Update
            if (updates.sizes && updates.sizes.length > 0) {
                // If current sizes is empty or default, update it
                const currentJson = JSON.stringify(product.sizes);
                if (currentJson === '[]' || currentJson === 'null') {
                    console.log(`\n📏 ${product.sku}: Sizes Found ${JSON.stringify(updates.sizes)}`);
                    toUpdate.sizes = updates.sizes;
                }
            }

            if (Object.keys(toUpdate).length > 0) {
                const { error: upErr } = await supabase
                    .from('products')
                    .update(toUpdate)
                    .eq('id', product.id);

                if (!upErr) updatedCount++;
                else console.error(`Failed to update ${product.sku}: ${upErr.message}`);
            }

        } catch (e) {
            console.error(`Error ${product.sku}: ${e.message}`);
        }
    }

    console.log(`\n✅ Completed. Updated ${updatedCount} products.`);
}

runOCR();
