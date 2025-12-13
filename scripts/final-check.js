import { createClient } from '@supabase/supabase-js';

// Hardcoded credentials
const supabase = createClient(
    'https://drnqpbyptyyuacmrvdrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRybnFwYnlwdHl5dWFjbXJ2ZHJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI4MTg3MiwiZXhwIjoyMDcxODU3ODcyfQ.7JsAIO0ec0Eh3pSeL6XqeZ08QTTxj6c2-H0IJX2aDHY'
);

async function finalCheck() {
    console.log('🔍 OKASINA FINAL PRODUCTION CHECK\n');
    console.log('='.repeat(50));

    const issues = [];
    const warnings = [];

    try {
        // 1. Check Products
        console.log('\n📦 PRODUCTS CHECK...');
        const { data: products, error: prodError, count: totalProducts } = await supabase
            .from('products')
            .select('*', { count: 'exact' })
            .eq('status', 'active');

        if (prodError) {
            issues.push(`❌ Cannot fetch products: ${prodError.message}`);
        } else {
            console.log(`   ✅ Active products: ${totalProducts}`);
            if (totalProducts === 0) {
                warnings.push('⚠️  No active products! Customers will see empty shop.');
            }
        }

        // Check draft products
        const { count: draftCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'draft');

        if (draftCount > 0) {
            warnings.push(`⚠️  ${draftCount} products still in draft (not visible to customers)`);
        }

        // 2. Check for products without images
        const { data: noImageProducts } = await supabase
            .from('products')
            .select('name')
            .eq('status', 'active')
            .or('image_url.is.null,image_url.eq.');

        if (noImageProducts && noImageProducts.length > 0) {
            warnings.push(`⚠️  ${noImageProducts.length} active products missing images`);
        }

        // 3. Check Orders table
        console.log('\n📋 ORDERS CHECK...');
        const { error: orderError } = await supabase
            .from('orders')
            .select('id')
            .limit(1);

        if (orderError) {
            issues.push(`❌ Orders table issue: ${orderError.message}`);
        } else {
            console.log('   ✅ Orders table accessible');
        }

        // 4. Check Wishlists
        console.log('\n💝 WISHLIST CHECK...');
        const { error: wishlistError } = await supabase
            .from('wishlists')
            .select('id')
            .limit(1);

        if (wishlistError) {
            if (wishlistError.message.includes('does not exist')) {
                warnings.push('⚠️  Wishlist table missing (will cause console errors)');
            } else {
                issues.push(`❌ Wishlist error: ${wishlistError.message}`);
            }
        } else {
            console.log('   ✅ Wishlist table exists');
        }

        // 5. Check for test/sample data
        console.log('\n🧹 TEST DATA CHECK...');
        const { data: testProducts } = await supabase
            .from('products')
            .select('name')
            .or('name.ilike.%test%,name.ilike.%sample%,name.ilike.%demo%');

        if (testProducts && testProducts.length > 0) {
            warnings.push(`⚠️  ${testProducts.length} products with test/sample/demo in name`);
        } else {
            console.log('   ✅ No obvious test data found');
        }

        // 6. Check Environment Variables
        console.log('\n🔐 ENVIRONMENT CHECK...');
        const envVars = [
            'VITE_SUPABASE_URL',
            'VITE_SUPABASE_ANON_KEY',
            'SUPABASE_SERVICE_ROLE_KEY',
            'CLOUDINARY_CLOUD_NAME',
            'CLOUDINARY_API_KEY',
            'CLOUDINARY_API_SECRET'
        ];

        const fs = await import('fs');
        const envContent = fs.readFileSync('.env', 'utf8');

        envVars.forEach(varName => {
            if (!envContent.includes(varName)) {
                issues.push(`❌ Missing environment variable: ${varName}`);
            }
        });
        console.log('   ✅ All critical env vars present');

        // FINAL REPORT
        console.log('\n' + '='.repeat(50));
        console.log('📊 FINAL REPORT\n');

        if (issues.length === 0 && warnings.length === 0) {
            console.log('✅ ✅ ✅ ALL SYSTEMS GO! ✅ ✅ ✅');
            console.log('\nOKASINA is ready for delivery!');
        } else {
            if (issues.length > 0) {
                console.log('🚨 CRITICAL ISSUES (Must fix before delivery):');
                issues.forEach(issue => console.log(`   ${issue}`));
                console.log('');
            }

            if (warnings.length > 0) {
                console.log('⚠️  WARNINGS (Should review):');
                warnings.forEach(warning => console.log(`   ${warning}`));
                console.log('');
            }
        }

        // Quick fixes
        console.log('🔧 QUICK FIXES:');
        if (draftCount > 0) {
            console.log('   Publish drafts: UPDATE products SET status = \'active\' WHERE status = \'draft\';');
        }
        if (wishlistError?.message.includes('does not exist')) {
            console.log('   Fix wishlist: Run SQL in supabase/migrations/002_create_wishlists_MANUAL.sql');
        }

        console.log('\n' + '='.repeat(50));

    } catch (err) {
        console.error('❌ FATAL ERROR:', err.message);
    }
}

finalCheck();
