import { createClient } from '@supabase/supabase-js';

// Hardcoded credentials
const supabase = createClient(
    'https://drnqpbyptyyuacmrvdrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRybnFwYnlwdHl5dWFjbXJ2ZHJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI4MTg3MiwiZXhwIjoyMDcxODU3ODcyfQ.7JsAIO0ec0Eh3pSeL6XqeZ08QTTxj6c2-H0IJX2aDHY'
);

async function testDeleteEndpoint() {
    console.log('🧪 Testing Delete Endpoint\n');

    try {
        // Get one draft product to test with
        const { data: products } = await supabase
            .from('products')
            .select('id, name')
            .eq('status', 'draft')
            .limit(1);

        if (!products || products.length === 0) {
            console.log('❌ No draft products found to test with');
            return;
        }

        const testProduct = products[0];
        console.log(`Testing delete of: ${testProduct.name} (${testProduct.id})\n`);

        // Test direct Supabase delete
        console.log('Test 1: Direct Supabase Delete...');
        const { error: directError } = await supabase
            .from('products')
            .delete()
            .eq('id', testProduct.id);

        if (directError) {
            console.log(`❌ Direct delete failed: ${directError.message}`);
            console.log('Error details:', directError);
        } else {
            console.log('✅ Direct delete succeeded!');
        }

        // Check if product still exists
        const { data: checkData } = await supabase
            .from('products')
            .select('id')
            .eq('id', testProduct.id);

        if (checkData && checkData.length > 0) {
            console.log('⚠️  Product still exists after delete attempt');
        } else {
            console.log('✅ Product successfully deleted');
        }

    } catch (err) {
        console.error('❌ Test failed:', err.message);
    }
}

testDeleteEndpoint();
