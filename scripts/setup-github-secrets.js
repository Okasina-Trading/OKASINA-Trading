import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env file
const envPath = path.resolve(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const secrets = {};

// Parse .env
envContent.split('\n').forEach(line => {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (key && value && !key.startsWith('#')) {
            secrets[key] = value;
        }
    }
});

// Secrets to sync
const URL_KEYS = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GOOGLE_AI_KEY',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
];

console.log('🔐 Setting GitHub Secrets from local .env...');

let count = 0;
const runCommand = (cmd) => {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) reject(error);
            else resolve(stdout);
        });
    });
};

const setSecrets = async () => {
    for (const key of URL_KEYS) {
        if (secrets[key]) {
            try {
                process.stdout.write(`   Setting ${key}... `);
                // Use gh secret set
                // We use echo to pipe the value to avoid command line argument limits or visibility
                // Note: PowerShell might need different piping, but we are in node.
                // Using standard piping for gh cli
                await runCommand(`echo ${secrets[key]} | gh secret set ${key}`);
                console.log('✅');
                count++;
            } catch (err) {
                console.log('❌ Failed');
                console.error(err.message);
            }
        } else {
            console.log(`⚠️  Skipping ${key} (Not found in .env)`);
        }
    }
    console.log(`\n🎉 Done! Set ${count} secrets.`);
    console.log('You can now re-run the GitHub Action.');
};

setSecrets();
