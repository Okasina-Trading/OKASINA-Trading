
import { v2 as cloudinary } from 'cloudinary';

// Hardcoded from .env view
const config = {
    cloud_name: 'dw86lrpv6',
    api_key: '121943449379972',
    api_secret: 'uVWGCQ4jKjQWo5xZMCdRMs7rdLo'
};

console.log('Testing Cloudinary Auth with:', config.cloud_name);

cloudinary.config(config);

async function testAuth() {
    try {
        const result = await cloudinary.api.ping();
        console.log('✅ Cloudinary Ping Success:', result);
    } catch (error) {
        console.error('❌ Cloudinary Ping Failed:', error.message);
    }
}

testAuth();
