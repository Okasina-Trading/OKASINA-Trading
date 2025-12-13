import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Old Supabase
const oldSupabase = createClient(
    'https://drnqpbyptyyuacmrvdrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRybnFwYnlwdHl5dWFjbXJ2ZHJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI4MTg3MiwiZXhwIjoyMDcxODU3ODcyfQ.7JsAIO0ec0Eh3pSeL6XqeZ08QTTxj6c2-H0IJX2aDHY'
);

// New Supabase
const newSupabase = createClient(
    'https://hthkrbtwfymaxtnvshfz.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0aGtyYnR3ZnltYXh0bnZzaGZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1NDU4MywiZXhwIjoyMDgxMjMwNTgzfQ.F4NrM1Bo2yC8tfEeDqgyzAv8LzFqIRRR3EnyYzIHyQs'
);

// Column mappings for tables with schema differences
const COLUMN_MAPPINGS = {
    products: (row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        category: row.category,
        subcategory: row.subcategory,
        price: row.price,
        price_mur: row.price_mur,
        stock_qty: row.stock_qty,
        sku: row.sku,
        status: row.status,
        image_url: row.image_url,
        sizes: row.sizes,
        tags: row.tags,
        features: row.features,
        created_at: row.created_at,
        updated_at: row.updated_at,
        design_no: row.design_no,
        fabric: row.fabric,
        color: row.color,
        cost_price: row.cost_price,
        selling_price: row.selling_price,
        mrp: row.mrp,
        currency: row.currency,
        care_instructions: row.care_instructions,
        seo_title: row.seo_title,
        seo_description: row.seo_description,
        ai_generated: row.ai_generated,
        ai_confidence: row.ai_confidence
        // Skipping: brand (doesn't exist in new schema)
    }),
    orders: (row) => ({
        customer_name: row.customer_name,
        customer_email: row.customer_email,
        customer_phone: row.customer_phone,
        shipping_address: row.shipping_address,
        items: row.items,
        total_amount: row.total_amount || row.amount, // Map 'amount' to 'total_amount'
        status: row.status,
        currency: row.currency,
        created_at: row.created_at,
        updated_at: row.updated_at
    }),
    clients: (row) => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
        address: row.address,
        region: row.region,
        notes: row.notes,
        created_at: row.created_at
        // Skipping: contact_email (doesn't exist in new schema)
    }),
    settings: (row) => ({
        id: row.id,
        key: row.key,
        value: row.value,
        description: row.description,
        created_at: row.created_at,
        updated_at: row.updated_at
    })
};

async function migrateTable(tableName) {
    console.log(`📤 Migrating ${tableName}...`);

    try {
        // Export from old
        const { data, error: exportError } = await oldSupabase
            .from(tableName)
            .select('*');

        if (exportError) {
            console.log(`   ⚠️  Error exporting: ${exportError.message}`);
            return { table: tableName, status: 'failed', error: exportError.message };
        }

        if (!data || data.length === 0) {
            console.log(`   ℹ️  Empty table, skipping`);
            return { table: tableName, status: 'empty', rows: 0 };
        }

        // Map columns if mapping exists
        const mappedData = COLUMN_MAPPINGS[tableName]
            ? data.map(COLUMN_MAPPINGS[tableName])
            : data;

        // Import to new
        const { error: importError } = await newSupabase
            .from(tableName)
            .insert(mappedData);

        if (importError) {
            console.log(`   ⚠️  Error importing: ${importError.message}`);
            return { table: tableName, status: 'failed', error: importError.message, rows: data.length };
        }

        console.log(`   ✅ Migrated ${data.length} rows`);
        return { table: tableName, status: 'success', rows: data.length };

    } catch (err) {
        console.log(`   ❌ Exception: ${err.message}`);
        return { table: tableName, status: 'error', error: err.message };
    }
}

async function migrateAllTables() {
    console.log('🔄 Starting migration with column mapping...\n');

    const tables = ['products', 'orders', 'wishlists', 'reviews', 'coupons', 'feedback', 'clients', 'settings'];
    console.log(`📊 Migrating ${tables.length} tables\n`);

    const results = [];

    for (const tableName of tables) {
        const result = await migrateTable(tableName);
        results.push(result);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));

    const successful = results.filter(r => r.status === 'success');
    const failed = results.filter(r => r.status === 'failed' || r.status === 'error');
    const empty = results.filter(r => r.status === 'empty');

    console.log(`✅ Successful: ${successful.length} tables`);
    console.log(`❌ Failed: ${failed.length} tables`);
    console.log(`ℹ️  Empty: ${empty.length} tables`);
    console.log(`📊 Total rows migrated: ${successful.reduce((sum, r) => sum + (r.rows || 0), 0)}`);

    if (successful.length > 0) {
        console.log('\n✅ Successfully migrated:');
        successful.forEach(r => console.log(`   - ${r.table}: ${r.rows} rows`));
    }

    if (failed.length > 0) {
        console.log('\n❌ Failed tables:');
        failed.forEach(r => console.log(`   - ${r.table}: ${r.error}`));
    }

    // Save report
    fs.writeFileSync('migration_report.json', JSON.stringify(results, null, 2));
    console.log('\n📄 Full report saved to migration_report.json');
}

migrateAllTables().catch(console.error);
