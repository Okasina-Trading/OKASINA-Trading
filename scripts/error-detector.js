import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load config and error patterns
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../okasina-config.json'), 'utf8'));
const errorPatterns = JSON.parse(fs.readFileSync(path.join(__dirname, '../okasina-error-patterns.json'), 'utf8'));

// Supabase client
const supabase = createClient(
    'https://drnqpbyptyyuacmrvdrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRybnFwYnlwdHl5dWFjbXJ2ZHJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI4MTg3MiwiZXhwIjoyMDcxODU3ODcyfQ.7JsAIO0ec0Eh3pSeL6XqeZ08QTTxj6c2-H0IJX2aDHY'
);

class ErrorDetector {
    constructor() {
        this.detectedErrors = [];
    }

    async scanHealthReport() {
        try {
            const reportPath = path.join(__dirname, 'tier1-health-latest.json');
            if (!fs.existsSync(reportPath)) {
                return { errors: [], message: 'No health report found' };
            }

            const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

            // Check for known error patterns
            for (const [errorType, pattern] of Object.entries(errorPatterns.errors)) {
                const detected = this.matchPattern(report, pattern);
                if (detected) {
                    this.detectedErrors.push({
                        type: errorType,
                        pattern: pattern,
                        detected_at: new Date().toISOString(),
                        can_auto_fix: pattern.auto_fix !== 'manual_required' && pattern.auto_fix !== 'manual_sql_required',
                        severity: pattern.severity
                    });
                }
            }

            return { errors: this.detectedErrors, count: this.detectedErrors.length };
        } catch (err) {
            console.error('Error scanning health report:', err);
            return { errors: [], error: err.message };
        }
    }

    matchPattern(report, pattern) {
        // Check if pattern matches health report
        const reportStr = JSON.stringify(report);

        // Simple regex match for now
        const regex = new RegExp(pattern.pattern, 'i');
        return regex.test(reportStr);
    }

    async checkRetryLimit(errorType) {
        try {
            const { data, error } = await supabase.rpc('check_auto_fix_retry_limit', {
                p_error_type: errorType,
                p_max_retries: errorPatterns.errors[errorType].max_retries_per_day
            });

            if (error) throw error;
            return data; // true if can retry, false if limit exceeded
        } catch (err) {
            console.warn('Could not check retry limit:', err.message);
            return true; // Default to allowing retry if check fails
        }
    }

    async routeToAutoFix() {
        if (!config.auto_fix_enabled) {
            console.log('⚠️  Auto-fix disabled by kill-switch');
            return { fixed: 0, skipped: this.detectedErrors.length };
        }

        const results = {
            attempted: 0,
            successful: 0,
            failed: 0,
            skipped: 0,
            details: []
        };

        for (const error of this.detectedErrors) {
            const pattern = errorPatterns.errors[error.type];

            // Check if auto-fix is allowed
            if (!config.allowed_auto_fixes.includes(pattern.auto_fix)) {
                console.log(`⚠️  Auto-fix '${pattern.auto_fix}' not in allowed list`);
                results.skipped++;
                continue;
            }

            // Check retry limit
            const canRetry = await this.checkRetryLimit(error.type);
            if (!canRetry) {
                console.log(`⚠️  Retry limit exceeded for ${error.type}`);
                results.skipped++;
                results.details.push({
                    error: error.type,
                    status: 'retry_limit_exceeded'
                });
                continue;
            }

            // Route to appropriate fix function
            console.log(`🔧 Attempting auto-fix for ${error.type}...`);
            results.attempted++;

            // This would call the actual fix function
            // For now, just log
            results.details.push({
                error: error.type,
                status: 'routed_to_fix',
                fix_function: pattern.fix_function
            });
        }

        return results;
    }

    async run() {
        console.log('🔍 OKASINA Error Detector Starting...\n');

        // Scan for errors
        const scanResult = await this.scanHealthReport();
        console.log(`Found ${scanResult.count} error patterns`);

        if (scanResult.count === 0) {
            console.log('✅ No errors detected');
            return { status: 'clean', errors: [] };
        }

        // Show detected errors
        console.log('\n📋 Detected Errors:');
        this.detectedErrors.forEach(err => {
            console.log(`  - ${err.type} (${err.severity})`);
            console.log(`    Can auto-fix: ${err.can_auto_fix ? 'Yes' : 'No'}`);
        });

        // Route to auto-fix
        console.log('\n🤖 Routing to auto-fix...');
        const fixResults = await this.routeToAutoFix();

        console.log('\n📊 Results:');
        console.log(`  Attempted: ${fixResults.attempted}`);
        console.log(`  Successful: ${fixResults.successful}`);
        console.log(`  Failed: ${fixResults.failed}`);
        console.log(`  Skipped: ${fixResults.skipped}`);

        return {
            status: 'complete',
            errors: this.detectedErrors,
            fix_results: fixResults
        };
    }
}

// Run detector
const detector = new ErrorDetector();
detector.run()
    .then(result => {
        console.log('\n✅ Error detection complete');
        process.exit(result.errors.length > 0 ? 1 : 0);
    })
    .catch(err => {
        console.error('FATAL:', err);
        process.exit(1);
    });
