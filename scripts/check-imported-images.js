import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Hardcoded credentials
const supabase = createClient(
    'https://drnqpbyptyyuacmrvdrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRybnFwYnlwdHl5dWFjbXJ2ZHJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI4MTg3MiwiZXhwIjoyMDcxODU3ODcyfQ.7JsAIO0ec0Eh3pSeL6XqeZ08QTTxj6c2-H0IJX2aDHY'
);

async function checkImportedImages() {
    console.log('🖼️  Checking Imported Product Images\n');

    try {
        const { data: products } = await supabase
            .from('products')
            .select('name, image_url, tags')
            .eq('status', 'draft')
            .order('name');

        if (!products || products.length === 0) {
            console.log('❌ No draft products found');
            return;
        }

        console.log(`Found ${products.length} imported products:\n`);

        // Group by supplier/folder
        const bySupplier = {};
        products.forEach(p => {
            const supplier = p.tags?.[0] || 'Unknown';
            if (!bySupplier[supplier]) bySupplier[supplier] = [];
            bySupplier[supplier].push(p);
        });

        // Show breakdown
        Object.keys(bySupplier).forEach(supplier => {
            const items = bySupplier[supplier];
            const withImages = items.filter(p => p.image_url && !p.image_url.includes('unsplash')).length;
            const withFallback = items.filter(p => p.image_url && p.image_url.includes('unsplash')).length;

            console.log(`📁 ${supplier}:`);
            console.log(`   Total: ${items.length}`);
            console.log(`   With real images: ${withImages}`);
            console.log(`   With fallback images: ${withFallback}`);
            console.log('');
        });

        // Show sample products with images
        console.log('📸 Sample Products with Images:');
        const withRealImages = products.filter(p => p.image_url && !p.image_url.includes('unsplash')).slice(0, 5);
        withRealImages.forEach(p => {
            console.log(`   ${p.name}: ${p.image_url?.substring(0, 60)}...`);
        });

        // Show products missing images
        const missingImages = products.filter(p => !p.image_url || p.image_url.includes('unsplash'));
        if (missingImages.length > 0) {
            console.log(`\n⚠️  ${missingImages.length} products using fallback images:`);
            missingImages.slice(0, 10).forEach(p => {
                console.log(`   ${p.name}`);
            });
            if (missingImages.length > 10) {
                console.log(`   ... and ${missingImages.length - 10} more`);
            }
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

checkImportedImages();
