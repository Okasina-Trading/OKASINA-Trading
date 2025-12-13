
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function checkToken() {
    const token = process.env.FACEBOOK_ACCESS_TOKEN;
    const pageId = process.env.FACEBOOK_PAGE_ID;

    if (!token) {
        console.log("❌ NO TOKEN FOUND in .env");
        return;
    }
    if (!pageId) {
        console.log("❌ NO PAGE ID FOUND in .env");
        return;
    }

    console.log(`Checking token for Page ID: ${pageId}...`);

    try {
        const response = await axios.get(`https://graph.facebook.com/v18.0/${pageId}/albums`, {
            params: { access_token: token, fields: 'id,name' }
        });
        console.log("✅ Token is VALID!");
        console.log(`Found ${response.data.data.length} albums.`);
    } catch (error) {
        console.log("❌ Token Check FAILED:");
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Error: ${JSON.stringify(error.response.data.error, null, 2)}`);
        } else {
            console.log(`   Error: ${error.message}`);
        }
    }
}

checkToken();
