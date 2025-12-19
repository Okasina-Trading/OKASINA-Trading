
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;

console.log('Testing Facebook Integration...');
console.log(`Page ID: ${PAGE_ID}`);
console.log(`Token Length: ${ACCESS_TOKEN ? ACCESS_TOKEN.length : 0}`);

if (!PAGE_ID || !ACCESS_TOKEN) {
    console.error('❌ Missing configuration!');
    process.exit(1);
}

async function testFacebook() {
    try {
        const url = `https://graph.facebook.com/v18.0/${PAGE_ID}?fields=name,id&access_token=${ACCESS_TOKEN}`;
        const res = await axios.get(url);
        console.log('✅ Connection Successful!');
        console.log('Page Name:', res.data.name);
        console.log('Page ID:', res.data.id);
    } catch (error) {
        console.error('❌ Connection Failed:', error.response ? error.response.data : error.message);
        process.exit(1);
    }
}

testFacebook();
