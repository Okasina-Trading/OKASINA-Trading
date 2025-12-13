
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envPath)) {
    console.log("❌ .env file not found!");
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const missing = [];

const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'EMAIL_USER',
    'EMAIL_PASS'
];

required.forEach(key => {
    if (!envContent.includes(key + '=')) {
        missing.push(key);
    }
});

if (missing.length > 0) {
    console.log("⚠️  Missing Environment Variables:");
    missing.forEach(m => console.log(`   - ${m}`));
    console.log("\nPlease add them to your .env file.");
} else {
    console.log("✅ All critical environment variables present.");
}
