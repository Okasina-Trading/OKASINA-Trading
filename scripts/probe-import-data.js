
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import glob from 'fast-glob';

const EXCEL_PATH = String.raw`G:\1. OKASINA\5. Imports Nov 2025 - Delhi\Imports Nov 2025.xlsx`;
const IMAGES_DIR = String.raw`D:\Delhi and Laam`;

console.log('🔍 PROBE: Inspecting Data Sources...\n');

async function runProbe() {
    const result = {
        excel: {
            found: false,
            headers: [],
            firstRow: [],
            sheetFound: false,
            sheetEmpty: false,
            availableSheets: [],
            error: null
        },
        images: {
            found: false,
            topLevelCount: 0,
            subDirs: [],
            sample: null,
            error: null
        }
    };

    // 1. Check Excel
    if (fs.existsSync(EXCEL_PATH)) {
        result.excel.found = true;
        try {
            const workbook = XLSX.readFile(EXCEL_PATH);
            result.excel.availableSheets = workbook.SheetNames;
            const sheetName = 'Consolidated Purchasing';

            if (workbook.SheetNames.includes(sheetName)) {
                result.excel.sheetFound = true;
                const worksheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (data.length > 0) {
                    result.excel.headers = data[0];
                    result.excel.firstRow = data[1];
                } else {
                    result.excel.sheetEmpty = true;
                }
            }
        } catch (err) {
            result.excel.error = err.message;
        }
    }

    // 2. Check Images (Targeted Search)
    if (fs.existsSync(IMAGES_DIR)) {
        result.images.found = true;
        try {
            const targetSKU = "AZ-1125-01"; // From Excel sample
            console.log(`🔍 Searching for images matching SKU: "${targetSKU}"...`);

            // Use fast-glob to search recursively
            // Glob needs forward slashes even on Windows
            const pattern = `${IMAGES_DIR.replace(/\\/g, '/')}/**/*${targetSKU}*`;
            const matches = await glob(pattern, { caseSensitiveMatch: false });

            result.images.matchTest = {
                sku: targetSKU,
                found: matches.length > 0,
                files: matches,
                count: matches.length
            };

            console.log(`✅ Match Test Result: Found ${matches.length} files for SKU ${targetSKU}`);
            if (matches.length > 0) console.log('   📸 Match:', matches[0]);

            const files = fs.readdirSync(IMAGES_DIR);
            const subDirs = files.filter(f => fs.statSync(path.join(IMAGES_DIR, f)).isDirectory());
            result.images.subDirs = subDirs;

        } catch (err) {
            result.images.error = err.message;
            console.error('Glob Warning:', err);
        }
    }

    fs.writeFileSync('probe_result.json', JSON.stringify(result, null, 2));
    console.log('✅ Probe Complete. Results in probe_result.json');
}

runProbe().catch(console.error);
