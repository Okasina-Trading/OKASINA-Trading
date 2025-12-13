
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function getPageId() {
    const token = process.env.FB_ACCESS_TOKEN;
    if (!token) {
        console.error("No FB_ACCESS_TOKEN in .env");
        return;
    }

    try {
        console.log("Fetching Pages for Token...");
        const response = await axios.get(`https://graph.facebook.com/v19.0/me/accounts?access_token=${token}`);

        if (response.data.data && response.data.data.length > 0) {
            const page = response.data.data[0];
            console.log(`✅ Found Page: ${page.name} (ID: ${page.id})`);

            // Append to .env
            const envPath = path.join(__dirname, '../.env');
            let envContent = fs.readFileSync(envPath, 'utf8');

            if (!envContent.includes('FACEBOOK_PAGE_ID=')) {
                fs.appendFileSync(envPath, `\nFACEBOOK_PAGE_ID=${page.id}`);
                console.log("Updated .env with FACEBOOK_PAGE_ID");
            } else {
                console.log("FACEBOOK_PAGE_ID already in .env, please update manually if needed.");
            }
        } else {
            console.error("❌ No pages found for this token. Does the user have 'pages_show_list' permission?");
        }
    } catch (error) {
        console.error("Error fetching pages:", error.response?.data || error.message);
    }
}

getPageId();
