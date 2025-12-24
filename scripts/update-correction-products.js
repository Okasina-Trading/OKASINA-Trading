
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updateProducts() {
    console.log("Updating Anarkali Red...");
    const { error: error1 } = await supabase
        .from('products')
        .update({
            price: 1350,
            sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL']
        })
        .ilike('name', '%Anarkali Red%');

    if (error1) console.error("Error updating Anarkali:", error1);
    else console.log("Anarkali Red updated.");

    console.log("Updating Churidars...");
    const { error: error2 } = await supabase
        .from('products')
        .update({
            price: 1995,
            sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL']
        })
        .ilike('name', 'Churidar'); // Strict match for "Churidar" to avoid updating other things? Or ilike for safety.
    // My previous search found 48 items exactly named "Churidar".

    if (error2) console.error("Error updating Churidars:", error2);
    else console.log("Churidars updated.");
}

updateProducts();
