import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://drnqpbyptyyuacmrvdrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRybnFwYnlwdHl5dWFjbXJ2ZHJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI4MTg3MiwiZXhwIjoyMDcxODU3ODcyfQ.7JsAIO0ec0Eh3pSeL6XqeZ08QTTxj6c2-H0IJX2aDHY'
);

async function quickSystemCheck() {
    console.log('🔍 OKASINA Quick System Check\n');

    try {
        // Check products
        const { count: active } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        const { count: draft } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'draft');

        console.log('📦 Products:');
        console.log(`   Active: ${active}`);
        console.log(`   Draft: ${draft}`);

        // Check if TITAN tables exist
        const { data: tables } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .in('table_name', ['az_agent_runs', 'az_auto_fix_attempts'])
            .eq('table_schema', 'public');

        console.log('\n🗄️  TITAN Tables:');
        if (tables && tables.length > 0) {
            tables.forEach(t => console.log(`   ✅ ${t.table_name}`));
        } else {
            console.log('   ⚠️  Not created yet (run 004_titan_command_tables.sql)');
        }

        // Check wishlist table
        const { error: wishlistError } = await supabase
            .from('wishlists')
            .select('id')
            .limit(1);

        console.log('\n💝 Wishlist Table:');
        if (wishlistError?.message.includes('does not exist')) {
            console.log('   ⚠️  Missing (run 002_create_wishlists_MANUAL.sql)');
        } else {
            console.log('   ✅ Exists');
        }

        console.log('\n📋 Summary:');
        if (active === 0 && draft > 0) {
            console.log('   ⚠️  CRITICAL: Shop will appear empty (all products in draft)');
            console.log('   Fix: Run DELETE_DRAFTS_EMERGENCY.sql OR publish drafts');
        } else if (active > 0) {
            console.log(`   ✅ Shop has ${active} visible products`);
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

quickSystemCheck();
