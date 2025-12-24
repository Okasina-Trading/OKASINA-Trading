
import { createClient } from '@supabase/supabase-js';
import Tesseract from 'tesseract.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Config
const IMAGE_DIR = String.raw`C:\Users\ICL  ZAMBIA\Desktop\okasina-fashion-store-vite\Website imports\Website import`;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use Anon Key as verified working
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log("🔌 URL:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function extractPriceFromText(text) {
    // Patterns:
    // Rs 1200
    // Rs. 1200
    // Price: 1200
    // 1200 (if isolate?)

    // Normalize text
    const clean = text.replace(/\n/g, ' ').replace(/\s+/g, ' ');

    // Pattern 1: Rs/MUR with number
    const rsMatch = clean.match(/(?:Rs\.?|MUR)\s*(\d+)/i);
    if (rsMatch) return parseInt(rsMatch[1]);

    // Pattern 2: "Price" keyword
    const priceMatch = clean.match(/Price:?\s*(\d+)/i);
    if (priceMatch) return parseInt(priceMatch[1]);

    return null;
}

async function runOCR() {
    console.log("🚀 Starting Local OCR Price Extraction...");

    // 1. Get all products from DB
    const { data: products, error } = await supabase
        .from('products')
        .select('id, sku, price, image_url');

    if (error) {
        console.error("❌ DB Error:", error.message);
        return;
    }

    console.log(`📊 Scanning ${products.length} products...`);

    let updated = 0;

    for (const product of products) {
        if (!product.sku) continue;

        // Find local image
        const extensions = ['.jpg', '.jpeg', '.png'];
        let localPath = null;
        for (const ext of extensions) {
            const p = path.join(IMAGE_DIR, `${product.sku}${ext}`);
            if (fs.existsSync(p)) {
                localPath = p;
                break;
            }
        }

        if (!localPath) {
            process.stdout.write('.'); // progress dot for skipped
            continue;
        }

        console.log(`\n🔍 OCR Analyzing: ${product.sku} (${path.basename(localPath)})`);

        try {
            const { data: { text } } = await Tesseract.recognize(localPath, 'eng', {
                logger: m => {
                    // minimal log
                    if (m.status === 'recognizing text') process.stdout.write(`chk:${Math.floor(m.progress * 100)}% `);
                }
            });

            console.log(`\n   📄 Extracted: "${text.substring(0, 50).replace(/\n/g, ' ')}..."`);

            const newPrice = await extractPriceFromText(text);

            if (newPrice && newPrice > 0) {
                console.log(`   💰 Found Price: ${newPrice} (Current: ${product.price})`);

                if (newPrice !== product.price) {
                    // Update DB
                    const { error: updateError } = await supabase
                        .from('products')
                        .update({ price: newPrice })
                        .eq('id', product.id);

                    if (updateError) console.error(`   ❌ Update Failed: ${updateError.message}`);
                    else {
                        console.log(`   ✅ Price Updated!`);
                        updated++;
                    }
                } else {
                    console.log(`   ✅ Price matches.`);
                }
            } else {
                console.log(`   ⚠️ No price found in text.`);
            }

        } catch (e) {
            console.error(`   ❌ OCR Error: ${e.message}`);
        }
    }

    console.log(`\n✅ OCR Complete. Updated ${updated} products.`);
}

runOCR();
