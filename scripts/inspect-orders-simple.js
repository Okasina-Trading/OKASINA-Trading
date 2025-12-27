import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function inspectSchema() {
    console.log('Inspecting orders table schema...');

    // We can't access information_schema directly easily with JS client unless we use rpc or just try to insert and see error, 
    // BUT we can use a clever trick: select * limit 0 and check data/error, or just try to fetch columns via PostgREST if exposed.
    // Actually, I'll try to use a raw query if I had a way, but I don't.
    // I can assume if I select * I get keys.

    // Better: Attempt to insert a dummy record that WILL fail, but hopefully give us column hints? No.
    // Best: Use the `rpc` if available to query pg_catalog, but probably not.
    // Alternative: Just fetch one row and see keys.

    const { data, error } = await supabase.from('orders').select('*').limit(1);

    if (error) {
        console.error('Error fetching orders:', error);
        return;
    }

    if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log('Columns found in a row:', columns);
        // This only shows columns that have data or are selected. Null columns appear? Yes.
    } else {
        console.log('No orders found to inspect columns from data.');
    }

    // Attempt to invoke a SQL query if there is a SQL runner function (often 'exec_sql' or similar in these setups)
    // Checking previous files, I didn't see a generic SQL runner.
    // I will try to infer 'total' existence by trying to select it.

    const { data: totalData, error: totalError } = await supabase.from('orders').select('total').limit(1);
    if (!totalError) {
        console.log('Column "total" EXISTS and is selectable.');
    } else {
        console.log('Column "total" select error:', totalError.message);
    }

    const { data: totalAmountData, error: totalAmountError } = await supabase.from('orders').select('total_amount').limit(1);
    if (!totalAmountError) {
        console.log('Column "total_amount" EXISTS and is selectable.');
    } else {
        console.log('Column "total_amount" select error:', totalAmountError.message);
    }
}

inspectSchema();
