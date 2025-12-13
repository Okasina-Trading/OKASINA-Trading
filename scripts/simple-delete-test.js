import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://drnqpbyptyyuacmrvdrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRybnFwYnlwdHl5dWFjbXJ2ZHJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI4MTg3MiwiZXhwIjoyMDcxODU3ODcyfQ.7JsAIO0ec0Eh3pSeL6XqeZ08QTTxj6c2-H0IJX2aDHY'
);

async function simpleDeleteTest() {
    console.log('Testing DELETE operation...\n');

    // Get one product
    const { data: products } = await supabase
        .from('products')
        .select('id, name')
        .limit(1);

    if (!products || products.length === 0) {
        console.log('No products to test');
        return;
    }

    const product = products[0];
    console.log(`Test product: ${product.name}`);
    console.log(`ID: ${product.id}\n`);

    // Try to delete
    console.log('Attempting delete...');
    const { error, data } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id)
        .select();

    if (error) {
        console.log('\n❌ DELETE FAILED');
        console.log('Error code:', error.code);
        console.log('Error message:', error.message);
        console.log('\nFull error:');
        console.log(JSON.stringify(error, null, 2));
    } else {
        console.log('\n✅ DELETE SUCCEEDED');
        console.log('Deleted:', data);
    }
}

simpleDeleteTest().catch(err => {
    console.error('Fatal error:', err.message);
});
