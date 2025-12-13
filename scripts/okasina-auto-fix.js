import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load config and error patterns
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../okasina-config.json'), 'utf8'));
const errorPatterns = JSON.parse(fs.readFileSync(path.join(__dirname, '../okasina-error-patterns.json'), 'utf8'));

// Hardcoded credentials
const supabase = createClient(
    'https://drnqpbyptyyuacmrvdrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRybnFwYnlwdHl5dWFjbXJ2ZHJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI4MTg3MiwiZXhwIjoyMDcxODU3ODcyfQ.7JsAIO0ec0Eh3pSeL6XqeZ08QTTxj6c2-H0IJX2aDHY'
);

class OkasinaAutoFix {
    constructor() {
        this.fixes = [];
        this.failures = [];
        this.runId = crypto.randomUUID();
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    }

    async checkRetryLimit(errorType) {
        try {
            const pattern = errorPatterns.errors[errorType];
            if (!pattern) return true;

            const { data, error } = await supabase.rpc('check_auto_fix_retry_limit', {
                p_error_type: errorType,
                p_max_retries: pattern.max_retries_per_day
            });

            if (error) {
                this.log(`Warning: Could not check retry limit: ${error.message}`, 'warn');
                return true; // Allow retry if check fails
            }

            return data;
        } catch (err) {
            this.log(`Warning: Retry limit check failed: ${err.message}`, 'warn');
            return true;
        }
    }

    async logAttempt(errorType, success, beforeState, afterState, changes) {
        try {
            await supabase.from('az_auto_fix_attempts').insert([{
                error_type: errorType,
                project: 'okasina',
                success: success,
                agent_name: 'OkasinaAutoFix',
                details: { run_id: this.runId },
                before_state: beforeState,
                after_state: afterState,
                changes_made: changes
            }]);
        } catch (err) {
            this.log(`Warning: Could not log attempt: ${err.message}`, 'warn');
        }
    }

    async fixDraftProducts() {
        this.log('🔧 Auto-Fix: Publishing draft products...');
        try {
            const { count: draftCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'draft');

            if (draftCount === 0) {
                this.log('✅ No draft products to publish');
                return { status: 'skipped', reason: 'No drafts' };
            }

            const { error, count } = await supabase
                .from('products')
                .update({ status: 'active' })
                .eq('status', 'draft');

            if (error) throw error;

            this.log(`✅ Published ${count} draft products`);
            this.fixes.push({ fix: 'publish_drafts', count });
            return { status: 'success', count };
        } catch (err) {
            this.log(`❌ Failed to publish drafts: ${err.message}`, 'error');
            this.failures.push({ fix: 'publish_drafts', error: err.message });
            return { status: 'failed', error: err.message };
        }
    }

    async fixWishlistTable() {
        this.log('🔧 Auto-Fix: Creating wishlist table...');
        try {
            // Check if table exists
            const { error: checkError } = await supabase
                .from('wishlists')
                .select('id')
                .limit(1);

            if (!checkError) {
                this.log('✅ Wishlist table already exists');
                return { status: 'skipped', reason: 'Already exists' };
            }

            if (!checkError.message.includes('does not exist')) {
                throw checkError;
            }

            // Read migration SQL
            const migrationPath = path.join(__dirname, '../supabase/migrations/002_create_wishlists_MANUAL.sql');
            const sql = fs.readFileSync(migrationPath, 'utf8');

            this.log('⚠️  Cannot auto-create table via script. Manual SQL required.');
            this.log('📝 Run this in Supabase SQL Editor:');
            this.log(migrationPath);

            this.failures.push({
                fix: 'wishlist_table',
                error: 'Requires manual SQL execution',
                action: `Run ${migrationPath} in Supabase SQL Editor`
            });

            return { status: 'manual_required', sqlPath: migrationPath };
        } catch (err) {
            this.log(`❌ Wishlist table fix failed: ${err.message}`, 'error');
            this.failures.push({ fix: 'wishlist_table', error: err.message });
            return { status: 'failed', error: err.message };
        }
    }

    async fixEnvVarWhitespace() {
        this.log('🔧 Auto-Fix: Cleaning environment variables...');
        try {
            const envPath = path.join(__dirname, '../.env');
            let envContent = fs.readFileSync(envPath, 'utf8');

            // Trim whitespace from all env var values
            const lines = envContent.split('\n');
            let fixed = 0;

            const cleanedLines = lines.map(line => {
                if (line.includes('=') && !line.trim().startsWith('#')) {
                    const [key, ...valueParts] = line.split('=');
                    const value = valueParts.join('=').trim();

                    if (valueParts.join('=') !== value) {
                        fixed++;
                        return `${key}=${value}`;
                    }
                }
                return line;
            });

            if (fixed > 0) {
                fs.writeFileSync(envPath, cleanedLines.join('\n'));
                this.log(`✅ Cleaned ${fixed} environment variables`);
                this.fixes.push({ fix: 'env_var_whitespace', count: fixed });
                return { status: 'success', count: fixed };
            } else {
                this.log('✅ No whitespace issues found');
                return { status: 'skipped', reason: 'Already clean' };
            }
        } catch (err) {
            this.log(`❌ Env var cleanup failed: ${err.message}`, 'error');
            this.failures.push({ fix: 'env_var_whitespace', error: err.message });
            return { status: 'failed', error: err.message };
        }
    }

    async runAllFixes() {
        this.log('🤖 OKASINA AUTO-FIX AGENT STARTING\n');
        this.log('='.repeat(60));

        const results = {
            timestamp: new Date().toISOString(),
            fixes: {},
            summary: {
                successful: 0,
                failed: 0,
                manual_required: 0,
                skipped: 0
            }
        };

        // Run all auto-fixes
        results.fixes.draftProducts = await this.fixDraftProducts();
        results.fixes.wishlistTable = await this.fixWishlistTable();
        results.fixes.envVarWhitespace = await this.fixEnvVarWhitespace();

        // Calculate summary
        Object.values(results.fixes).forEach(fix => {
            if (fix.status === 'success') results.summary.successful++;
            if (fix.status === 'failed') results.summary.failed++;
            if (fix.status === 'manual_required') results.summary.manual_required++;
            if (fix.status === 'skipped') results.summary.skipped++;
        });

        results.appliedFixes = this.fixes;
        results.failures = this.failures;

        // Save report
        const reportPath = path.join(__dirname, 'auto-fix-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

        // Print summary
        this.log('\n' + '='.repeat(60));
        this.log('📊 AUTO-FIX SUMMARY\n');
        this.log(`Successful: ${results.summary.successful}`);
        this.log(`Failed: ${results.summary.failed}`);
        this.log(`Manual Required: ${results.summary.manual_required}`);
        this.log(`Skipped: ${results.summary.skipped}`);
        this.log(`\nReport saved: ${reportPath}`);

        if (results.summary.failed > 0 || results.summary.manual_required > 0) {
            this.log('\n⚠️  Some fixes require manual intervention', 'warn');
        } else {
            this.log('\n✅ ALL AUTO-FIXES COMPLETED');
        }

        return results;
    }
}

// Run auto-fixes
const autoFix = new OkasinaAutoFix();
autoFix.runAllFixes()
    .then(results => {
        process.exit(results.summary.failed > 0 ? 1 : 0);
    })
    .catch(err => {
        console.error('FATAL:', err);
        process.exit(1);
    });
