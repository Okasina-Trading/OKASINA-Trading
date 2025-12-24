
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('id, name, price, sizes, color, description, image_url')
        .or('name.ilike.%Churidar%,name.ilike.%Anarkali%');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Found Products:', data.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        sizes: p.sizes,
        color: p.color,
        image_url: p.image_url
    })));
}

findProducts();
