
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';

// Hardcoded Credentials
cloudinary.config({
    cloud_name: 'dw86lrpv6',
    api_key: '121943449379972',
    api_secret: 'uVWGCQ4jKjQWo5xZMCdRMs7rdLo'
});

// A dummy image URL or valid localized path? I'll use a remote image for testing upload.
// If remote fails, I'll use a local file path if I can find one. 
// Step 862 found: "D:\Delhi and Laam\1. DELHI 1125\3. AZYSH\AZ-1125-01.1.jpg"
// I need to use a valid path format.
const testImagePath = String.raw`D:\Delhi and Laam\1. DELHI 1125\3. AZYSH\AZ-1125-01.1.jpg`;

async function testUpload() {
    console.log('🚀 Testing Cloudinary Upload...');
    try {
        const result = await cloudinary.uploader.upload(testImagePath, {
            folder: 'test_upload',
            public_id: 'test_sku_1125'
        });
        console.log('✅ Upload Success:', result.secure_url);
    } catch (error) {
        console.error('❌ Upload Failed:', error);
    }
}

testUpload();
