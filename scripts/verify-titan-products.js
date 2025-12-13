import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Hardcoded credentials (same as titan-import.js)
const supabase = createClient(
    'https://drnqpbyptyyuacmrvdrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRybnFwYnlwdHl5dWFjbXJ2ZHJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI4MTg3MiwiZXhwIjoyMDcxODU3ODcyfQ.7JsAIO0ec0Eh3pSeL6XqeZ08QTTxj6c2-H0IJX2aDHY'
);

async function verifyTitanProducts() {
    console.log('🔍 Verifying TITAN Import Quality...\n');

    try {
        // Get sample of imported products
        const { data: products, error } = await supabase
            .from('products')
            .select('name, description, price, price_mur, image_url, stock_qty, status, tags')
            .eq('status', 'draft')
            .limit(5);

        if (error) throw error;

        if (!products || products.length === 0) {
            console.log('❌ No draft products found. Were they deleted?');
            return;
        }

        console.log(`📦 Found ${products.length} sample products:\n`);

        products.forEach((p, i) => {
            console.log(`${i + 1}. ${p.name}`);
            console.log(`   Description: ${p.description?.substring(0, 80)}...`);
            console.log(`   Price: $${p.price} USD / Rs ${p.price_mur} MUR`);
            console.log(`   Stock: ${p.stock_qty}`);
            console.log(`   Image: ${p.image_url ? '✅ Has image' : '❌ No image'}`);
            console.log(`   Tags: ${p.tags?.join(', ') || 'None'}`);
            console.log('');
        });

        // Get total count
        const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'draft');

        console.log(`\n📊 Total Draft Products: ${count}`);

        // Check for issues
        const { data: noImage } = await supabase
            .from('products')
            .select('name')
            .eq('status', 'draft')
            .is('image_url', null);

        const { data: noPrice } = await supabase
            .from('products')
            .select('name')
            .eq('status', 'draft')
            .or('price_mur.is.null,price_mur.eq.0');

        console.log('\n⚠️  Quality Issues:');
        console.log(`   Products without images: ${noImage?.length || 0}`);
        console.log(`   Products without price: ${noPrice?.length || 0}`);

        console.log('\n✅ Verification Complete!');
        console.log('\n📝 Next Steps:');
        console.log('   1. Review the sample products above');
        console.log('   2. If data looks good: UPDATE products SET status = \'active\' WHERE status = \'draft\'');
        console.log('   3. If data is wrong: node scripts/delete-draft-products.js');

    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

verifyTitanProducts();
