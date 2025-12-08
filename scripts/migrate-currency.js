
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env manually
const envPath = path.resolve(__dirname, '../.env');
console.log('Loading .env from:', envPath);
try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const parseEnv = (key) => {
        const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
        return match ? match[1].trim().replace(/^["']|["']$/g, '') : '';
    };

    process.env.VITE_SUPABASE_URL = parseEnv('VITE_SUPABASE_URL');
    process.env.SUPABASE_SERVICE_ROLE_KEY = parseEnv('SUPABASE_SERVICE_ROLE_KEY');
} catch (e) {
    console.error('Failed to read .env:', e);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateCurrency() {
    console.log('💱 Starting USD -> MUR Database Migration...');

    // 1. Fetch all products
    const { data: products, error } = await supabase.from('products').select('*');

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    console.log(`Found ${products.length} products to check.`);

    let updatedCount = 0;

    for (const product of products) {
        // Heuristic: If price is less than 500, assume it's USD and convert.
        // A typical saree is Rs 1500+. Use 500 as safe threshold.
        if (product.price < 500 && product.price > 0) {
            const newPrice = Math.round(product.price * 45);

            const { error: updateError } = await supabase
                .from('products')
                .update({
                    price: newPrice,
                    price_mur: newPrice // Sync both columns to be safe
                })
                .eq('id', product.id);

            if (updateError) {
                console.error(`Failed to update ${product.name}:`, updateError);
            } else {
                console.log(`✅ Converted: "${product.name}" $${product.price} -> Rs ${newPrice}`);
                updatedCount++;
            }
        } else {
            console.log(`Skipping: "${product.name}" (Price ${product.price} seems already MUR)`);
        }
    }

    console.log(`\n✨ Migration Complete. Converted ${updatedCount} products.`);
}

migrateCurrency();
