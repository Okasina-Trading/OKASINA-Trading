import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Check which files exist
const files = ['.env', '.env.local', '.env.production', '.env.development', '.env.example'];
console.log('--- Checking .env files ---');
files.forEach(f => {
    if (fs.existsSync(f)) {
        console.log(`✅ Found ${f}`);
        // Try reading raw (safe check)
        const content = fs.readFileSync(f, 'utf8');
        const hasGemini = content.includes('GOOGLE_AI_KEY') || content.includes('VITE_GEMINI_API_KEY');
        const hasCloudinary = content.includes('CLOUDINARY_CLOUD_NAME');
        console.log(`   - Has Gemini Key? ${hasGemini}`);
        console.log(`   - Has Cloudinary? ${hasCloudinary}`);
    } else {
        console.log(`❌ Missing ${f}`);
    }
});

// Load dotenv
const result = dotenv.config();
if (result.error) {
    console.log('Error loading .env:', result.error);
}

console.log('\n--- Active Process Env ---');
console.log('GOOGLE_AI_KEY:', !!process.env.GOOGLE_AI_KEY);
console.log('VITE_GEMINI_API_KEY:', !!process.env.VITE_GEMINI_API_KEY);
console.log('CLOUDINARY_CLOUD_NAME:', !!process.env.CLOUDINARY_CLOUD_NAME);
console.log('NODE_ENV:', process.env.NODE_ENV);
