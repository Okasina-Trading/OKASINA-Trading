
import { createClient } from '@supabase/supabase-js';

const URL = 'https://hthkrbtwfymaxtnvshfz.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0aGtyYnR3ZnltYXh0bnZzaGZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1NDU4MywiZXhwIjoyMDgxMjMwNTgzfQ.F4NrM1Bo2yC8tfEeDqgyzAv8LzFqIRRR3EnyYzIHyQs';

console.log('--- Direct Key Verification ---');
console.log('URL:', URL);
console.log('Key Length:', KEY.length);

const supabase = createClient(URL, KEY);

async function test() {
    try {
        const { data, error } = await supabase.from('products').select('count').limit(1).single();
        if (error) {
            console.error('❌ FAILURE:', error.message);
        } else {
            console.log('✅ SUCCESS! The key works.');
        }
    } catch (e) {
        console.error('❌ EXCEPTION:', e.message);
    }
}

test();
