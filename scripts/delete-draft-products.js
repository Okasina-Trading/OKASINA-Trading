import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteAllDraftProducts() {
    console.log('🗑️  Deleting all draft products...');

    try {
        // First, get count
        const { count, error: countError } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'draft');

        if (countError) throw countError;

        console.log(`Found ${count} draft products`);

        if (count === 0) {
            console.log('✅ No draft products to delete');
            return;
        }

        // Confirm
        console.log(`\n⚠️  About to delete ${count} draft products. Press Ctrl+C to cancel...`);
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Delete
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('status', 'draft');

        if (error) throw error;

        console.log(`✅ Successfully deleted ${count} draft products!`);

    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

deleteAllDraftProducts();
