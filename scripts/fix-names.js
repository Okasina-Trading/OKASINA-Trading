
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env manually to avoid parser issues
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
    process.env.VITE_SUPABASE_ANON_KEY = parseEnv('VITE_SUPABASE_ANON_KEY');
} catch (e) {
    console.error('Failed to read .env:', e);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('Key:', supabaseKey ? 'Found' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const upgrades = [
    { from: 'Chic Fashion', to: 'Varanasi Silk Saree' },
    { from: 'Classic Fashion', to: 'Embroidered Anarkali Suit' },
    { from: 'Modern Fashion', to: 'Contemporary Lehenga Choli' },
    { from: 'Elegant Fashion', to: 'Royal Velvet Sherwani' },
    { from: 'Trendy Fashion', to: 'Designer Georgette Kurti' },
    { from: 'Premium Fashion', to: 'Handwoven Banarasi Dupatta' },
    { from: 'Luxury Fashion', to: 'Zardosi Work Bridal Lehenga' },
    { from: 'Formal Blazer', to: 'Classic Tuxedo Suit' },
    { from: 'Casual Wear', to: 'Printed Cotton Kurta' }
];

async function updateNames() {
    console.log('🔄 Starting Product Name Update...');

    // 1. Fetch all products
    const { data: products, error } = await supabase.from('products').select('*');

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    console.log(`Found ${products.length} products.`);

    // 2. Update generic names
    let updatedCount = 0;

    for (const product of products) {
        // Find a matching upgrade or random one if it's generic "Fashion"
        let newName = null;

        const upgrade = upgrades.find(u => product.name.includes(u.from));
        if (upgrade) {
            newName = upgrade.to;
        } else if (product.name.includes('Fashion')) {
            // Randomly assign one if it's just "Fashion" and not matched
            newName = upgrades[Math.floor(Math.random() * upgrades.length)].to;
        }

        if (newName && newName !== product.name) {
            const { error: updateError } = await supabase
                .from('products')
                .update({ name: newName })
                .eq('id', product.id);

            if (updateError) {
                console.error(`Failed to update ${product.name}:`, updateError);
            } else {
                console.log(`✅ Updated: "${product.name}" -> "${newName}"`);
                updatedCount++;
            }
        }
    }

    console.log(`\n✨ Update Complete. Refreshed ${updatedCount} product names.`);
}

updateNames();
