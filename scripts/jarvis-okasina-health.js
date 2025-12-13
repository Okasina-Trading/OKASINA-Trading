import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const CONFIG = {
    TIER: process.env.HEALTH_TIER || 'fast', // 'fast' or 'deep'
    AUTO_FIX_ENABLED: process.env.AUTO_FIX_ENABLED !== 'false',
    MAX_RETRIES_PER_DAY: 3
};

// Hardcoded credentials (TITAN standard)
const supabase = createClient(
    'https://drnqpbyptyyuacmrvdrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRybnFwYnlwdHl5dWFjbXJ2ZHJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI4MTg3MiwiZXhwIjoyMDcxODU3ODcyfQ.7JsAIO0ec0Eh3pSeL6XqeZ08QTTxj6c2-H0IJX2aDHY'
);

class JarvisOkasinaHealth {
    constructor(tier = 'fast') {
        this.tier = tier;
        this.checks = [];
        this.errors = [];
        this.warnings = [];
        this.startTime = Date.now();
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const entry = { timestamp, level, message };

        if (level === 'error') this.errors.push(entry);
        if (level === 'warn') this.warnings.push(entry);

        console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    }

    async checkDatabase() {
        this.log('Checking database connectivity...');
        try {
            const { data, error } = await supabase
                .from('products')
                .select('id')
                .limit(1);

            if (error) throw error;
            this.log('✅ Database: Connected', 'success');
            return { status: 'healthy', details: 'Supabase accessible' };
        } catch (err) {
            this.log(`❌ Database: ${err.message}`, 'error');
            return { status: 'unhealthy', error: err.message };
        }
    }

    async checkProducts() {
        this.log('Checking product data...');
        try {
            const { count: active } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');

            const { count: draft } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'draft');

            this.log(`✅ Products: ${active} active, ${draft} draft`);

            if (active === 0 && draft > 0) {
                this.log(`⚠️  Warning: ${draft} products in draft (shop will appear empty)`, 'warn');
            }

            return { status: 'healthy', active, draft };
        } catch (err) {
            this.log(`❌ Products check failed: ${err.message}`, 'error');
            return { status: 'unhealthy', error: err.message };
        }
    }

    async checkDeleteFunction() {
        this.log('Testing delete function...');
        try {
            // Get a test product
            const { data: products } = await supabase
                .from('products')
                .select('id, name')
                .limit(1);

            if (!products || products.length === 0) {
                this.log('⚠️  No products to test delete with', 'warn');
                return { status: 'skipped', reason: 'No products' };
            }

            const testProduct = products[0];

            // Try to delete
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', testProduct.id);

            if (error) {
                this.log(`❌ Delete function broken: ${error.message}`, 'error');
                return { status: 'unhealthy', error: error.message };
            }

            this.log('✅ Delete function: Working');
            return { status: 'healthy', tested: testProduct.name };
        } catch (err) {
            this.log(`❌ Delete test failed: ${err.message}`, 'error');
            return { status: 'unhealthy', error: err.message };
        }
    }

    async checkWishlistTable() {
        this.log('Checking wishlist table...');
        try {
            const { error } = await supabase
                .from('wishlists')
                .select('id')
                .limit(1);

            if (error) {
                if (error.message.includes('does not exist')) {
                    this.log('⚠️  Wishlist table missing (will cause console errors)', 'warn');
                    return { status: 'degraded', issue: 'table_missing' };
                }
                throw error;
            }

            this.log('✅ Wishlist table: Exists');
            return { status: 'healthy' };
        } catch (err) {
            this.log(`❌ Wishlist check failed: ${err.message}`, 'error');
            return { status: 'unhealthy', error: err.message };
        }
    }

    async checkEnvironmentVars() {
        this.log('Checking environment variables...');
        const required = [
            'VITE_SUPABASE_URL',
            'VITE_SUPABASE_ANON_KEY',
            'SUPABASE_SERVICE_ROLE_KEY',
            'CLOUDINARY_CLOUD_NAME',
            'CLOUDINARY_API_KEY',
            'CLOUDINARY_API_SECRET'
        ];

        const missing = [];
        const hasWhitespace = [];

        try {
            const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');

            required.forEach(varName => {
                if (!envContent.includes(varName)) {
                    missing.push(varName);
                } else {
                    // Check for whitespace issues
                    const match = envContent.match(new RegExp(`${varName}=(.+)`));
                    if (match && (match[1].startsWith(' ') || match[1].endsWith(' '))) {
                        hasWhitespace.push(varName);
                    }
                }
            });

            if (missing.length > 0) {
                this.log(`❌ Missing env vars: ${missing.join(', ')}`, 'error');
            }

            if (hasWhitespace.length > 0) {
                this.log(`⚠️  Env vars with whitespace: ${hasWhitespace.join(', ')}`, 'warn');
            }

            if (missing.length === 0 && hasWhitespace.length === 0) {
                this.log('✅ Environment variables: All present and clean');
            }

            return {
                status: missing.length > 0 ? 'unhealthy' : (hasWhitespace.length > 0 ? 'degraded' : 'healthy'),
                missing,
                hasWhitespace
            };
        } catch (err) {
            this.log(`❌ Cannot read .env file: ${err.message}`, 'error');
            return { status: 'unhealthy', error: err.message };
        }
    }

    async runAllChecks() {
        this.log('🔍 JARVIS OKASINA HEALTH CHECK STARTING\n');
        this.log('='.repeat(60));

        const results = {
            timestamp: new Date().toISOString(),
            checks: {},
            summary: {
                total: 0,
                healthy: 0,
                degraded: 0,
                unhealthy: 0,
                skipped: 0
            }
        };

        // Run all checks
        results.checks.database = await this.checkDatabase();
        results.checks.products = await this.checkProducts();
        results.checks.deleteFunction = await this.checkDeleteFunction();
        results.checks.wishlistTable = await this.checkWishlistTable();
        results.checks.environmentVars = await this.checkEnvironmentVars();

        // Calculate summary
        Object.values(results.checks).forEach(check => {
            results.summary.total++;
            if (check.status === 'healthy') results.summary.healthy++;
            if (check.status === 'degraded') results.summary.degraded++;
            if (check.status === 'unhealthy') results.summary.unhealthy++;
            if (check.status === 'skipped') results.summary.skipped++;
        });

        // Overall health
        if (results.summary.unhealthy > 0) {
            results.overallHealth = 'CRITICAL';
        } else if (results.summary.degraded > 0) {
            results.overallHealth = 'DEGRADED';
        } else {
            results.overallHealth = 'HEALTHY';
        }

        results.errors = this.errors;
        results.warnings = this.warnings;
        results.duration = Date.now() - this.startTime;

        // Save report
        const reportPath = path.join(__dirname, 'jarvis-health-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

        // Print summary
        this.log('\n' + '='.repeat(60));
        this.log('📊 HEALTH CHECK SUMMARY\n');
        this.log(`Overall Status: ${results.overallHealth}`);
        this.log(`Healthy: ${results.summary.healthy}/${results.summary.total}`);
        this.log(`Degraded: ${results.summary.degraded}/${results.summary.total}`);
        this.log(`Unhealthy: ${results.summary.unhealthy}/${results.summary.total}`);
        this.log(`Duration: ${results.duration}ms`);
        this.log(`\nReport saved: ${reportPath}`);

        if (results.overallHealth !== 'HEALTHY') {
            this.log('\n⚠️  ISSUES DETECTED - Review report for details', 'warn');
        } else {
            this.log('\n✅ ALL SYSTEMS OPERATIONAL');
        }

        return results;
    }
}

// Run health check
const jarvis = new JarvisOkasinaHealth();
jarvis.runAllChecks()
    .then(results => {
        process.exit(results.overallHealth === 'HEALTHY' ? 0 : 1);
    })
    .catch(err => {
        console.error('FATAL:', err);
        process.exit(1);
    });
