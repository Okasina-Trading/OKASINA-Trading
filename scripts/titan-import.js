
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import glob from 'fast-glob';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load Env
dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const EXCEL_PATH = String.raw`G:\1. OKASINA\5. Imports Nov 2025 - Delhi\Imports Nov 2025.xlsx`;
const IMAGES_DIR = String.raw`D:\Delhi and Laam`;
const SHEET_NAME = 'Consolidated Purchasing';

// Initialize Services
// Hardcoded Supabase Credentials (Verified from .env view)
const supabase = createClient(
    'https://drnqpbyptyyuacmrvdrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRybnFwYnlwdHl5dWFjbXJ2ZHJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI4MTg3MiwiZXhwIjoyMDcxODU3ODcyfQ.7JsAIO0ec0Eh3pSeL6XqeZ08QTTxj6c2-H0IJX2aDHY',
    { auth: { persistSession: false } }
);

// Hardcoded Credentials (Verified Working)
cloudinary.config({
    cloud_name: 'dw86lrpv6',
    api_key: '121943449379972',
    api_secret: 'uVWGCQ4jKjQWo5xZMCdRMs7rdLo'
});

// Debug Config (Masked)
console.log('☁️  Cloudinary Config Check:');
console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME ? process.env.CLOUDINARY_CLOUD_NAME : 'MISSING'}`);
console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY ? process.env.CLOUDINARY_API_KEY.slice(0, 4) + '...' : 'MISSING'}`);
console.log(`   API Secret: ${process.env.CLOUDINARY_API_SECRET ? 'PRESENT' : 'MISSING'}`);
console.log('--------------------------------');

// Logging
const LOG_FILE = path.join(__dirname, 'import_report_v2.json');
const report = {
    total: 0,
    success: 0,
    skipped: 0,
    failed: 0,
    errors: []
};

function log(msg, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warn' ? '⚠️' : 'ℹ️';
    console.log(`${icon} [${timestamp}] ${msg}`);
}

async function uploadToCloudinary(filePath, publicId) {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'products',
            public_id: publicId,
            resource_type: 'image'
        });
        return result.secure_url;
    } catch (error) {
        throw new Error(`Cloudinary Upload Failed: ${error.message}`);
    }
}

async function runImport() {
    log('🚀 Titan Import Engine Starting...');

    // 1. Read Excel
    if (!fs.existsSync(EXCEL_PATH)) {
        throw new Error(`Excel file not found: ${EXCEL_PATH}`);
    }

    const workbook = XLSX.readFile(EXCEL_PATH);
    if (!workbook.SheetNames.includes(SHEET_NAME)) {
        throw new Error(`Sheet "${SHEET_NAME}" not found. Available: ${workbook.SheetNames.join(', ')}`);
    }

    const worksheet = workbook.Sheets[SHEET_NAME];
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    log(`📊 Found ${rawData.length} rows in Excel.`);

    // 2. Process Rows
    for (const [index, row] of rawData.entries()) {
        const sku = row['Design Num']; // Verify column name from probe

        if (!sku) {
            report.skipped++;
            continue;
        }

        report.total++;
        log(`Processing [${index + 1}/${rawData.length}] SKU: ${sku}...`);

        try {
            // Check if product exists
            const { data: existing } = await supabase
                .from('products')
                .select('id')
                .eq('sku', sku) // Assuming we use 'sku' column or 'name' as unique identifier
                .maybeSingle();

            if (existing) {
                log(`Skipping existing product: ${sku}`, 'warn');
                report.skipped++;
                continue;
            }

            // 3. Find Image
            // Normalize path for glob
            const searchDir = IMAGES_DIR.replace(/\\/g, '/');
            // Pattern: Recursive search for *SKU*
            const pattern = `${searchDir}/**/*${sku}*`;
            const matches = await glob(pattern, { caseSensitiveMatch: false });

            // Filter for actual images
            const imageMatches = matches.filter(f => /\.(jpg|jpeg|png|webp|heic)$/i.test(f));

            let imageUrl = null;
            if (imageMatches.length > 0) {
                const localImagePath = imageMatches[0];
                log(`   📸 Found Image: ${path.basename(localImagePath)}`);

                try {
                    // Upload to Cloudinary
                    imageUrl = await uploadToCloudinary(localImagePath, sku);
                    log(`   ☁️ Uploaded to Cloudinary`);
                } catch (uploadErr) {
                    log(`   ⚠️ Cloudinary Upload Failed: ${uploadErr.message}. Importing without image.`, 'warn');
                    report.errors.push({ sku, error: `Image Upload Failed: ${uploadErr.message}` });
                    // Proceed with imageUrl = null
                }
            } else {
                log(`   ⚠️ No image found for ${sku}`, 'warn');
            }

            // 4. Prepare Data
            // "Price" column (Col P) from probe results seems to be the one (1094.19...)
            // "Tag Price" is 4400.
            // "Rate - INR" is 895.
            const priceMur = parseFloat(row['Price']) || 0;
            const sizeString = row['Size'] ? String(row['Size']) : 'Free Size';

            const product = {
                name: sku,
                description: `${row['Description'] || `Imported ${row['Supplier']} Collection`} | Size: ${sizeString}`,
                price: Math.round(priceMur / 45) || 1, // Convert MUR to USD approximation
                price_mur: Math.round(priceMur) || 50, // MUR price (required field)
                category: 'Clothing',
                image_url: imageUrl || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800',
                stock_qty: parseInt(row['Qty']) || 1,
                status: 'draft',
                tags: [row['Supplier'] || 'Imported', sizeString]
            };

            // 5. Insert into DB
            const { error } = await supabase.from('products').insert([product]);

            if (error) throw error;

            report.success++;
            log(`   ✅ Imported successfully`);

        } catch (err) {
            report.failed++;
            report.errors.push({ sku, error: err.message });
            log(`   ❌ Failed: ${err.message}`, 'error');
        }
    }

    // save report
    fs.writeFileSync(LOG_FILE, JSON.stringify(report, null, 2));
    log(`🏁 Import Complete. Success: ${report.success}, Failed: ${report.failed}, Skipped: ${report.skipped}`);
    log(`📄 Full report saved to ${LOG_FILE}`);
}

runImport().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});
