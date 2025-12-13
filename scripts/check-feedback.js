
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkFeedback() {
    console.log("Checking JARVIS Feedback Table...");
    const { data, error } = await supabase
        .from('jarvis_feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log(`Found ${data.length} recent reports:`);
        data.forEach(item => {
            console.log(`[${new Date(item.created_at).toLocaleString()}] ${item.type.toUpperCase()}: ${item.message} (Status: ${item.status || 'open'})`);
        });
    }
}

checkFeedback();
