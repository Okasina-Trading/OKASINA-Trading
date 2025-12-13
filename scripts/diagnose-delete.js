import { createClient } from '@supabase/supabase-js';

// Test with BOTH keys to see which one works
const supabaseService = createClient(
    'https://drnqpbyptyyuacmrvdrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRybnFwYnlwdHl5dWFjbXJ2ZHJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI4MTg3MiwiZXhwIjoyMDcxODU3ODcyfQ.7JsAIO0ec0Eh3pSeL6XqeZ08QTTxj6c2-H0IJX2aDHY'
);

async function diagnoseDelete() {
    console.log('🔍 COMPREHENSIVE DELETE DIAGNOSTIC\n');
    console.log('='.repeat(60));

    try {
        // 1. Get a product to test with
        console.log('\n1️⃣ Finding a test product...');
        const { data: products, error: fetchError } = await supabaseService
            .from('products')
            .select('id, name, status')
            .limit(1);

        if (fetchError) {
            console.log('❌ Cannot even FETCH products!');
            console.log('Error:', JSON.stringify(fetchError, null, 2));
            return;
        }

        if (!products || products.length === 0) {
            console.log('❌ No products in database to test with');
            return;
        }

        const testProduct = products[0];
        console.log(`✅ Found test product: ${testProduct.name} (${testProduct.id})`);

        // 2. Check RLS policies
        console.log('\n2️⃣ Checking RLS policies...');
        const { data: policies, error: policyError } = await supabaseService.rpc('exec', {
            query: `
                SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
                FROM pg_policies
                WHERE tablename = 'products';
            `
        }).catch(() => ({ data: null, error: 'RPC not available' }));

        if (policies) {
            console.log('RLS Policies:', policies);
        } else {
            console.log('⚠️  Cannot check RLS policies (not critical)');
        }

        // 3. Try direct delete with service role
        console.log('\n3️⃣ Attempting DELETE with service role...');
        const { error: deleteError, count } = await supabaseService
            .from('products')
            .delete({ count: 'exact' })
            .eq('id', testProduct.id);

        if (deleteError) {
            console.log('❌ DELETE FAILED!');
            console.log('Error Code:', deleteError.code);
            console.log('Error Message:', deleteError.message);
            console.log('Error Details:', JSON.stringify(deleteError, null, 2));

            // Check if it's a foreign key constraint
            if (deleteError.message?.includes('foreign key') || deleteError.message?.includes('violates')) {
                console.log('\n🔍 DIAGNOSIS: Foreign Key Constraint!');
                console.log('This product is referenced in another table (orders, cart, wishlist, etc.)');
                console.log('You must delete the related records first.');

                // Check for related records
                console.log('\n4️⃣ Checking for related records...');

                const { data: orders } = await supabaseService
                    .from('orders')
                    .select('id')
                    .contains('items', [{ product_id: testProduct.id }])
                    .limit(1);

                if (orders && orders.length > 0) {
                    console.log('⚠️  Product is in orders table');
                }

                const { data: carts } = await supabaseService
                    .from('carts')
                    .select('id')
                    .eq('product_id', testProduct.id)
                    .limit(1);

                if (carts && carts.length > 0) {
                    console.log('⚠️  Product is in carts table');
                }
            }

            if (deleteError.message?.includes('permission') || deleteError.message?.includes('RLS')) {
                console.log('\n🔍 DIAGNOSIS: RLS Permission Issue!');
                console.log('Row Level Security is blocking the delete.');
                console.log('Service role should bypass RLS, but something is wrong.');
            }

        } else {
            console.log('✅ DELETE SUCCEEDED!');
            console.log(`Deleted ${count} row(s)`);
        }

        // 5. Verify deletion
        console.log('\n5️⃣ Verifying deletion...');
        const { data: checkData } = await supabaseService
            .from('products')
            .select('id')
            .eq('id', testProduct.id);

        if (checkData && checkData.length > 0) {
            console.log('❌ Product STILL EXISTS after delete!');
        } else {
            console.log('✅ Product successfully removed from database');
        }

        console.log('\n' + '='.repeat(60));
        console.log('📋 SUMMARY\n');
        console.log('If delete failed, the error above tells you WHY.');
        console.log('Common causes:');
        console.log('  1. Foreign key constraint (product in orders/cart)');
        console.log('  2. RLS policy blocking delete');
        console.log('  3. Invalid service role key');

    } catch (err) {
        console.error('\n❌ FATAL ERROR:', err.message);
        console.error('Stack:', err.stack);
    }
}

diagnoseDelete();
