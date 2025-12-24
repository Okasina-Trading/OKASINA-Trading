
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verifyUpdates() {
    const { data: anarkali } = await supabase.from('products').select('*').ilike('name', '%Anarkali Red%');
    console.log("Anarkali:", anarkali.map(p => ({ name: p.name, price: p.price, sizes: p.sizes })));

    const { data: churidars } = await supabase.from('products').select('*').ilike('name', 'Churidar');
    console.log("Churidar Sample (first 3):", churidars.slice(0, 3).map(p => ({ name: p.name, price: p.price, sizes: p.sizes })));
}

verifyUpdates();
