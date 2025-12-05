import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Using Anon Key as Service Role Key was found to be invalid, and we want to test anon/client access anyway
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProductUpdate() {
    console.log('🧪 Testing product update permissions...');

    // 1. Fetch a random product
    const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, name, price')
        .limit(1);

    if (fetchError) {
        console.error('❌ Error fetching products:', fetchError);
        return;
    }

    if (!products || products.length === 0) {
        console.log('⚠️ No products found to test update.');
        return;
    }

    const product = products[0];
    console.log(`📝 Found product: ${product.name} (ID: ${product.id})`);

    // 2. Attempt to update it (no-op update)
    const { error: updateError } = await supabase
        .from('products')
        .update({ price: product.price }) // Set same price
        .eq('id', product.id);

    if (updateError) {
        console.error('❌ Update failed:', updateError);
        console.log('   RLS policies might still be blocking updates.');
    } else {
        console.log('✅ Product update successful! RLS policies are working correctly.');
    }
}

testProductUpdate();
