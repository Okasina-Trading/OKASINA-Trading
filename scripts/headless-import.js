
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';

// Load Environment Variables
dotenv.config();

// Configuration - USER PROVIDED PATHS
const CSV_PATH = String.raw`C:\Users\ICL  ZAMBIA\Desktop\okasina-fashion-store-vite\Website imports\okasina_simple_template.csv`;
const IMAGE_DIR = String.raw`C:\Users\ICL  ZAMBIA\Desktop\okasina-fashion-store-vite\Website imports\Website import`;

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dw86lrpv6',
    api_key: process.env.CLOUDINARY_API_KEY || '121943449379972',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'uVWGCQ4jKjQWo5xZMCdRMs7rdLo'
});

// Supabase Config
const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Since RLS is disabled, we can use the Anon Key to insert!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
console.log(`🔌 Headless Import URL: ${supabaseUrl}`);
console.log("🔑 Using ANON KEY (RLS must be disabled for this to work)");
const supabase = createClient(supabaseUrl, supabaseKey);

async function formatPrice(priceStr) {
    if (!priceStr) return 0;
    return parseFloat(String(priceStr).replace(/[^0-9.]/g, '')) || 0;
}

async function uploadImage(filePath) {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'okasina_products',
            use_filename: true,
            unique_filename: false,
            overwrite: true
        });
        return result.secure_url;
    } catch (error) {
        console.error(`❌ Upload Failed for ${path.basename(filePath)}:`, error.message);
        return null;
    }
}

async function findImageFile(sku) {
    if (!fs.existsSync(IMAGE_DIR)) {
        console.error(`❌ Image Directory not found: ${IMAGE_DIR}`);
        return null;
    }

    const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
    // Try exact SKU match first
    for (const ext of extensions) {
        const fullPath = path.join(IMAGE_DIR, `${sku}${ext}`);
        if (fs.existsSync(fullPath)) return fullPath;
    }

    // Try finding file that STARTS with SKU (e.g. AZ-001_front.jpg)
    const files = fs.readdirSync(IMAGE_DIR);
    const match = files.find(f => f.startsWith(sku) && extensions.includes(path.extname(f).toLowerCase()));

    if (match) return path.join(IMAGE_DIR, match);
    return null;
}

async function runImport() {
    console.log("🚀 Starting Headless Import...");
    console.log(`📂 CSV: ${CSV_PATH}`);
    console.log(`📸 Images: ${IMAGE_DIR}`);

    if (!fs.existsSync(CSV_PATH)) {
        console.error("❌ CSV File not found!");
        process.exit(1);
    }

    const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
    const { data, errors } = Papa.parse(csvContent, { header: true, skipEmptyLines: true });

    if (errors.length > 0) {
        console.error("⚠️ CSV Parsing Errors:", errors);
    }

    console.log(`📊 Found ${data.length} rows. Processing...`);

    let success = 0;
    let failed = 0;

    for (const row of data) {
        const result = await processRow(row);
        if (result) {
            success++;
        } else {
            failed++;
        }
    }

    console.log("\n==============================");
    console.log(`✅ Import Complete`);
    console.log(`Successful: ${success}`);
    console.log(`Failed: ${failed}`);
    console.log("==============================");
}

runImport();
