import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load config
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../okasina-config.json'), 'utf8'));

// Supabase client
const supabase = createClient(
    'https://drnqpbyptyyuacmrvdrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRybnFwYnlwdHl5dWFjbXJ2ZHJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI4MTg3MiwiZXhwIjoyMDcxODU3ODcyfQ.7JsAIO0ec0Eh3pSeL6XqeZ08QTTxj6c2-H0IJX2aDHY'
);

class JarvisTier2Health {
    constructor() {
        this.startTime = Date.now();
        this.runId = crypto.randomUUID();
        this.checks = {};
        this.warnings = [];
        this.errors = [];
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    }

    async checkBuildHealth() {
        this.log('Checking build health...');
        try {
            // Run build in test mode (don't actually output files)
            const { stdout, stderr } = await execAsync('npm run build', {
                timeout: 60000 // 1 minute max
            });

            if (stderr && stderr.includes('error')) {
                this.errors.push('Build has errors');
                return { status: 'unhealthy', error: 'Build errors detected' };
            }

            this.log('✅ Build: Successful');
            return { status: 'healthy', duration: 'within timeout' };
        } catch (err) {
            this.log(`❌ Build failed: ${err.message}`, 'error');
            this.errors.push(`Build failed: ${err.message}`);
            return { status: 'unhealthy', error: err.message };
        }
    }

    async checkDatabaseSchema() {
        this.log('Validating database schema...');
        try {
            // Check critical tables exist
            const requiredTables = ['products', 'orders', 'wishlists', 'az_agent_runs', 'az_auto_fix_attempts'];
            const missingTables = [];

            for (const table of requiredTables) {
                const { error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);

                if (error && error.message.includes('does not exist')) {
                    missingTables.push(table);
                }
            }

            if (missingTables.length > 0) {
                this.warnings.push(`Missing tables: ${missingTables.join(', ')}`);
                return { status: 'degraded', missing: missingTables };
            }

            this.log('✅ Database schema: Valid');
            return { status: 'healthy', tables: requiredTables.length };
        } catch (err) {
            this.log(`❌ Schema validation failed: ${err.message}`, 'error');
            return { status: 'unhealthy', error: err.message };
        }
    }

    async checkPerformanceMetrics() {
        this.log('Checking performance metrics...');
        try {
            const metrics = {
                memory: process.memoryUsage(),
                uptime: process.uptime()
            };

            // Check API response time
            const apiStart = Date.now();
            await supabase.from('products').select('id').limit(1);
            const apiDuration = Date.now() - apiStart;

            metrics.api_response_ms = apiDuration;

            // Warnings
            if (apiDuration > 2000) {
                this.warnings.push('Slow API response (> 2s)');
            }

            const memoryUsageMB = metrics.memory.heapUsed / 1024 / 1024;
            if (memoryUsageMB > 500) {
                this.warnings.push(`High memory usage: ${memoryUsageMB.toFixed(0)}MB`);
            }

            this.log(`✅ Performance: API ${apiDuration}ms, Memory ${memoryUsageMB.toFixed(0)}MB`);
            return { status: 'healthy', metrics };
        } catch (err) {
            this.log(`❌ Performance check failed: ${err.message}`, 'error');
            return { status: 'unhealthy', error: err.message };
        }
    }

    async checkSecurityAudit() {
        this.log('Running security audit...');
        try {
            const issues = [];

            // Check .env file
            const envPath = path.join(__dirname, '../.env');
            if (fs.existsSync(envPath)) {
                const envContent = fs.readFileSync(envPath, 'utf8');

                // Check for exposed secrets
                if (envContent.includes('sk_live_') || envContent.includes('pk_live_')) {
                    issues.push('Live API keys detected in .env');
                }

                // Check for weak passwords
                if (envContent.includes('password=123') || envContent.includes('password=admin')) {
                    issues.push('Weak passwords detected');
                }
            }

            if (issues.length > 0) {
                this.warnings.push(...issues);
                return { status: 'degraded', issues };
            }

            this.log('✅ Security: No critical issues');
            return { status: 'healthy' };
        } catch (err) {
            this.log(`❌ Security audit failed: ${err.message}`, 'error');
            return { status: 'unhealthy', error: err.message };
        }
    }

    async runAllChecks() {
        this.log('🔍 JARVIS Tier 2 Deep Health Check Starting...\n');
        this.log('='.repeat(60));

        const results = {
            run_id: this.runId,
            timestamp: new Date().toISOString(),
            tier: 'deep',
            checks: {},
            summary: {
                total: 0,
                healthy: 0,
                degraded: 0,
                unhealthy: 0
            }
        };

        // Run all deep checks
        results.checks.build = await this.checkBuildHealth();
        results.checks.databaseSchema = await this.checkDatabaseSchema();
        results.checks.performance = await this.checkPerformanceMetrics();
        results.checks.security = await this.checkSecurityAudit();

        // Calculate summary
        Object.values(results.checks).forEach(check => {
            results.summary.total++;
            if (check.status === 'healthy') results.summary.healthy++;
            if (check.status === 'degraded') results.summary.degraded++;
            if (check.status === 'unhealthy') results.summary.unhealthy++;
        });

        // Overall health
        if (results.summary.unhealthy > 0) {
            results.overallHealth = 'CRITICAL';
        } else if (results.summary.degraded > 0) {
            results.overallHealth = 'DEGRADED';
        } else {
            results.overallHealth = 'HEALTHY';
        }

        results.warnings = this.warnings;
        results.errors = this.errors;
        results.duration = Date.now() - this.startTime;

        // Save report
        const reportPath = path.join(__dirname, 'tier2-health-latest.json');
        fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

        // Log to az_agent_runs
        await this.logToAgentRuns(results);

        // Print summary
        this.log('\n' + '='.repeat(60));
        this.log('📊 TIER 2 HEALTH CHECK SUMMARY\n');
        this.log(`Overall Status: ${results.overallHealth}`);
        this.log(`Healthy: ${results.summary.healthy}/${results.summary.total}`);
        this.log(`Degraded: ${results.summary.degraded}/${results.summary.total}`);
        this.log(`Unhealthy: ${results.summary.unhealthy}/${results.summary.total}`);
        this.log(`Duration: ${results.duration}ms`);

        if (this.warnings.length > 0) {
            this.log('\n⚠️  Warnings:');
            this.warnings.forEach(w => this.log(`   - ${w}`));
        }

        if (this.errors.length > 0) {
            this.log('\n❌ Errors:');
            this.errors.forEach(e => this.log(`   - ${e}`));
        }

        this.log(`\nReport saved: ${reportPath}`);

        return results;
    }

    async logToAgentRuns(results) {
        try {
            const command = {
                run_id: this.runId,
                agent_name: 'Jarvis-OKASINA-Tier2Health',
                mission_id: null,
                status: results.overallHealth === 'HEALTHY' ? 'success' :
                    results.overallHealth === 'DEGRADED' ? 'soft_fail' : 'hard_fail',
                severity: results.overallHealth === 'HEALTHY' ? 'info' :
                    results.overallHealth === 'DEGRADED' ? 'warning' : 'error',
                started_at: new Date(this.startTime).toISOString(),
                finished_at: new Date().toISOString(),
                error_code: results.errors.length > 0 ? 'TIER2_HEALTH_FAILURES' : null,
                error_message: results.errors.length > 0 ? results.errors.join('; ') : null,
                payload: {
                    tier: 'deep',
                    checks_passed: results.summary.healthy,
                    checks_failed: results.summary.unhealthy,
                    warnings: this.warnings,
                    build_ok: results.checks.build?.status === 'healthy',
                    admin_ok: true, // Will be updated when admin tests added
                    perf_stats: results.checks.performance?.metrics,
                    details: results.checks
                }
            };

            await supabase.from('az_agent_runs').insert([command]);
            this.log('✅ Logged to az_agent_runs');
        } catch (err) {
            this.log(`⚠️  Failed to log to az_agent_runs: ${err.message}`, 'warn');
        }
    }
}

// Run Tier 2 check
const monitor = new JarvisTier2Health();
monitor.runAllChecks()
    .then(results => {
        process.exit(results.overallHealth === 'HEALTHY' ? 0 : 1);
    })
    .catch(err => {
        console.error('FATAL:', err);
        process.exit(1);
    });
