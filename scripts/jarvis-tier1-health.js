import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load config
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../okasina-config.json'), 'utf8'));

// Supabase client
const supabase = createClient(
    'https://drnqpbyptyyuacmrvdrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRybnFwYnlwdHl5dWFjbXJ2ZHJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI4MTg3MiwiZXhwIjoyMDcxODU3ODcyfQ.7JsAIO0ec0Eh3pSeL6XqeZ08QTTxj6c2-H0IJX2aDHY'
);

class JarvisTier1Health {
    constructor() {
        this.startTime = Date.now();
        this.runId = crypto.randomUUID();
        this.checks = {};
        this.failureCount = 0;
    }

    async checkFrontendReachable() {
        try {
            // Check if localhost:5173 is responding
            const response = await fetch('http://localhost:5173', {
                timeout: 3000,
                headers: { 'User-Agent': 'JARVIS-Health-Monitor' }
            });

            if (response.ok) {
                return { status: 'healthy', code: response.status };
            } else {
                return { status: 'degraded', code: response.status };
            }
        } catch (err) {
            return { status: 'unhealthy', error: err.message };
        }
    }

    async checkKeyAPIEndpoints() {
        const endpoints = [
            '/api/citadel/vitals',
            '/api/products'
        ];

        const results = {};

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`http://localhost:5173${endpoint}`, {
                    timeout: 2000
                });
                results[endpoint] = response.ok ? 'healthy' : 'degraded';
            } catch (err) {
                results[endpoint] = 'unhealthy';
            }
        }

        const allHealthy = Object.values(results).every(s => s === 'healthy');
        return {
            status: allHealthy ? 'healthy' : 'degraded',
            endpoints: results
        };
    }

    async checkSupabaseConnectivity() {
        try {
            const { error } = await supabase
                .from('products')
                .select('id')
                .limit(1);

            if (error) throw error;
            return { status: 'healthy' };
        } catch (err) {
            return { status: 'unhealthy', error: err.message };
        }
    }

    async checkStatusFile() {
        try {
            const statusPath = path.join(__dirname, 'health-status.json');

            if (!fs.existsSync(statusPath)) {
                // Create initial status file
                const initialStatus = {
                    last_updated: new Date().toISOString(),
                    version: '1.0.0',
                    status: 'operational'
                };
                fs.writeFileSync(statusPath, JSON.stringify(initialStatus, null, 2));
            }

            const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
            return { status: 'healthy', data: status };
        } catch (err) {
            return { status: 'degraded', error: err.message };
        }
    }

    async runAllChecks() {
        console.log(`[${new Date().toISOString()}] 🚀 JARVIS Tier 1 Health Check (Run ID: ${this.runId})`);

        // Run all fast checks
        this.checks.frontend = await this.checkFrontendReachable();
        this.checks.apiEndpoints = await this.checkKeyAPIEndpoints();
        this.checks.supabase = await this.checkSupabaseConnectivity();
        this.checks.statusFile = await this.checkStatusFile();

        // Calculate overall health
        const unhealthyChecks = Object.values(this.checks).filter(c => c.status === 'unhealthy').length;
        this.failureCount = unhealthyChecks;

        const overallHealth = unhealthyChecks === 0 ? 'HEALTHY' :
            unhealthyChecks <= 1 ? 'DEGRADED' : 'CRITICAL';

        const duration = Date.now() - this.startTime;

        const report = {
            run_id: this.runId,
            timestamp: new Date().toISOString(),
            tier: 'fast',
            overall_health: overallHealth,
            checks: this.checks,
            duration_ms: duration,
            failure_count: this.failureCount
        };

        // Save report
        const reportPath = path.join(__dirname, 'tier1-health-latest.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // Log to az_agent_runs (standard Command object)
        await this.logToAgentRuns(report, overallHealth);

        // Console output
        console.log(`✅ Health: ${overallHealth} | Duration: ${duration}ms | Failures: ${this.failureCount}/4`);

        return report;
    }

    async logToAgentRuns(report, overallHealth) {
        try {
            const command = {
                run_id: this.runId,
                agent_name: 'Jarvis-OKASINA-Health-Tier1',
                mission_id: null,
                status: overallHealth === 'HEALTHY' ? 'success' :
                    overallHealth === 'DEGRADED' ? 'soft_fail' : 'hard_fail',
                severity: overallHealth === 'HEALTHY' ? 'info' :
                    overallHealth === 'DEGRADED' ? 'warning' : 'error',
                started_at: new Date(this.startTime).toISOString(),
                finished_at: new Date().toISOString(),
                error_code: this.failureCount > 0 ? 'HEALTH_CHECK_FAILURES' : null,
                error_message: this.failureCount > 0 ? `${this.failureCount} checks failed` : null,
                payload: {
                    tier: 'fast',
                    checks_passed: 4 - this.failureCount,
                    checks_failed: this.failureCount,
                    details: this.checks
                }
            };

            const { error } = await supabase
                .from('az_agent_runs')
                .insert([command]);

            if (error) {
                console.warn('⚠️  Failed to log to az_agent_runs:', error.message);
            }
        } catch (err) {
            console.warn('⚠️  az_agent_runs logging error:', err.message);
        }
    }
}

// Run check
const monitor = new JarvisTier1Health();
monitor.runAllChecks()
    .then(report => {
        process.exit(report.overall_health === 'HEALTHY' ? 0 : 1);
    })
    .catch(err => {
        console.error('FATAL:', err);
        process.exit(1);
    });
