
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkVisibility() {
    console.log("🕵️ Checking Product Visibility...");

    // 1. Admin Check (Service Role)
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { count: adminCount, error: adminError } = await adminClient
        .from('products')
        .select('*', { count: 'exact', head: true });

    if (adminError) console.error("❌ Admin Error:", adminError);
    else console.log(`✅ Admin sees: ${adminCount} products`);

    // 2. Public Check (Anon Key - Simulating Frontend)
    const publicClient = createClient(supabaseUrl, anonKey);
    const { count: publicCount, error: publicError } = await publicClient
        .from('products')
        .select('*', { count: 'exact', head: true });

    if (publicError) console.error("❌ Public Error:", publicError);
    else console.log(`👀 Public sees: ${publicCount} products`);

    if (adminCount > 0 && publicCount === 0) {
        console.log("\n🚨 DIAGNOSIS: RLS is blocking public access!");
    }
}

checkVisibility();
