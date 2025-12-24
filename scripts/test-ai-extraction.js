
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import fetch from 'node-fetch';

// Load Environment Variables
dotenv.config();

// Configuration
const IMAGE_DIR = String.raw`C:\Users\ICL  ZAMBIA\Desktop\okasina-fashion-store-vite\temp_images`;
const API_URL = 'http://localhost:3002/api/analyze-product-image';

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dw86lrpv6',
    api_key: process.env.CLOUDINARY_API_KEY || '121943449379972',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'uVWGCQ4jKjQWo5xZMCdRMs7rdLo'
});

async function uploadImage(filePath) {
    try {
        console.log(`📤 Uploading ${path.basename(filePath)}...`);
        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'okasina_debug',
            use_filename: true,
            unique_filename: false,
            overwrite: true
        });
        return result.secure_url;
    } catch (error) {
        console.error(`❌ Upload Failed:`, error.message);
        return null;
    }
}

async function testAiExtraction() {
    console.log("🚀 Starting AI Extraction Test...");

    if (!fs.existsSync(IMAGE_DIR)) {
        console.error(`❌ Image Directory not found: ${IMAGE_DIR}`);
        process.exit(1);
    }

    // Process all JPG/PNG files
    const files = fs.readdirSync(IMAGE_DIR);
    const imageFiles = files.filter(f => ['.jpg', '.jpeg', '.png'].includes(path.extname(f).toLowerCase()));

    if (imageFiles.length === 0) {
        console.error("❌ No images found to test.");
        process.exit(1);
    }

    console.log(`📸 Found ${imageFiles.length} images.`);

    for (const imageFile of imageFiles) {
        await processImage(path.join(IMAGE_DIR, imageFile));
    }
}

async function processImage(fullPath) {
    const fileName = path.basename(fullPath);
    console.log(`\n---------------------------------`);
    console.log(`📸 Processing: ${fileName}`);

    // 1. Upload
    const imageUrl = await uploadImage(fullPath);
    if (!imageUrl) return;

    console.log(`✅ Uploaded to: ${imageUrl}`);
    console.log(`🧠 Sending to Google Gemini Vision...`);

    const geminiKey = process.env.GOOGLE_AI_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!geminiKey) {
        console.error("❌ No Google AI Key found in .env");
        return;
    }

    // Prepare Base64
    const imgRes = await fetch(imageUrl);
    const buf = await imgRes.arrayBuffer();
    const base64 = Buffer.from(buf).toString('base64');

    const prompt = `
      Analyze this product image which may have handwritten or drawn corrections (circles, text).
      Extract the following details into a valid JSON object:
      - product_name: The name of the product visible in the image (e.g. "Churidar", "Anarkali Red").
      - corrected_price: The price explicitly marked or circled (e.g. inside a red circle). If two prices exist, prefer the one in the circle or the one that looks like a correction. Return as number.
      - available_sizes: All sizes mentioned or circled (e.g. "5XL", "7XL", "6XL").
      - other_notes: Any other text explicitly written or circled.
      
      Return ONLY the JSON. Do not include markdown formatting.
    `;

    // Call Google
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            { inline_data: { mime_type: 'image/jpeg', data: base64 } }
                        ]
                    }]
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Google API Message: ${errorText}`);
        }

        const data = await response.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        // Cleanup markdown
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const product = JSON.parse(text);

        console.log("🤖 EXTRACTED DATA:");
        console.log(JSON.stringify(product, null, 2));

    } catch (error) {
        console.error("❌ AI Analysis Failed:", error.message);
    }
}

testAiExtraction();
