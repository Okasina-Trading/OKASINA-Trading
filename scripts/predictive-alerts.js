import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load config
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../okasina-config.json'), 'utf8'));
const thresholds = config.predictive_alerts.thresholds;

// Supabase client
const supabase = createClient(
    'https://drnqpbyptyyuacmrvdrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRybnFwYnlwdHl5dWFjbXJ2ZHJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI4MTg3MiwiZXhwIjoyMDcxODU3ODcyfQ.7JsAIO0ec0Eh3pSeL6XqeZ08QTTxj6c2-H0IJX2aDHY'
);

class PredictiveAlerts {
    constructor() {
        this.alerts = [];
        this.thresholds = thresholds;
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    }

    async analyzeErrorTrend() {
        this.log('Analyzing error trends...');
        try {
            // Get errors from last 24 hours
            const { data: runs, error } = await supabase
                .from('az_agent_runs')
                .select('started_at, status, severity')
                .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                .order('started_at', { ascending: true });

            if (error) {
                this.log(`⚠️  Could not fetch agent runs: ${error.message}`, 'warn');
                return { status: 'unknown', reason: 'No data' };
            }

            if (!runs || runs.length === 0) {
                return { status: 'healthy', reason: 'No runs yet' };
            }

            // Count errors per hour
            const errorsByHour = {};
            runs.forEach(run => {
                if (run.status === 'hard_fail') {
                    const hour = new Date(run.started_at).getHours();
                    errorsByHour[hour] = (errorsByHour[hour] || 0) + 1;
                }
            });

            // Check if error rate is increasing over consecutive hours
            const hours = Object.keys(errorsByHour).map(Number).sort((a, b) => a - b);
            if (hours.length >= this.thresholds.error_rate_consecutive_hours) {
                // Check last N consecutive hours
                const recentHours = hours.slice(-this.thresholds.error_rate_consecutive_hours);
                const allAboveThreshold = recentHours.every(h =>
                    errorsByHour[h] >= this.thresholds.error_rate_per_hour
                );

                if (allAboveThreshold) {
                    const avgErrors = recentHours.reduce((sum, h) => sum + errorsByHour[h], 0) / recentHours.length;
                    this.alerts.push({
                        type: 'error_rate_increasing',
                        severity: 'warning',
                        message: `Error rate sustained: ${avgErrors.toFixed(1)} errors/hour for ${this.thresholds.error_rate_consecutive_hours} consecutive hours (threshold: ${this.thresholds.error_rate_per_hour}/hour)`,
                        prediction: `System may become unstable in next ${config.predictive_alerts.prediction_window_minutes.min}-${config.predictive_alerts.prediction_window_minutes.max} minutes`
                    });
                    return { status: 'warning', trend: 'increasing', consecutive_hours: this.thresholds.error_rate_consecutive_hours };
                }
            }

            this.log('✅ Error trend: Normal');
            return { status: 'healthy', trend: 'stable' };
        } catch (err) {
            this.log(`❌ Error trend analysis failed: ${err.message}`, 'error');
            return { status: 'error', error: err.message };
        }
    }

    async checkResourceTrends() {
        this.log('Checking resource trends...');
        try {
            const warnings = [];

            // Check memory usage trend
            const memoryUsageMB = process.memoryUsage().heapUsed / 1024 / 1024;
            if (memoryUsageMB > 400) {
                warnings.push({
                    type: 'high_memory',
                    severity: 'warning',
                    message: `Memory usage: ${memoryUsageMB.toFixed(0)}MB (threshold: 400MB)`,
                    prediction: 'May hit memory limit in 2-4 hours if trend continues'
                });
            }

            // Check disk space (if accessible)
            try {
                const { execSync } = await import('child_process');
                const diskInfo = execSync('wmic logicaldisk get size,freespace,caption').toString();
                // Parse disk info and check if < 10GB free
                // (simplified for now)
            } catch (err) {
                // Disk check not critical
            }

            if (warnings.length > 0) {
                this.alerts.push(...warnings);
                this.log(`⚠️  Resource warnings: ${warnings.length}`);
                return { status: 'warning', warnings };
            }

            this.log('✅ Resources: Normal');
            return { status: 'healthy' };
        } catch (err) {
            this.log(`❌ Resource check failed: ${err.message}`, 'error');
            return { status: 'error', error: err.message };
        }
    }

    async detectAnomalies() {
        this.log('Detecting anomalies...');
        try {
            // Get product count trend
            const { count: currentProducts } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');

            // Check if product count dropped suddenly
            // (would need historical data for real anomaly detection)
            if (currentProducts < 10) {
                this.alerts.push({
                    type: 'low_product_count',
                    severity: 'critical',
                    message: `Only ${currentProducts} active products (unusual drop?)`,
                    prediction: 'Shop may appear empty to customers'
                });
                return { status: 'critical', anomaly: 'low_products' };
            }

            this.log('✅ Anomalies: None detected');
            return { status: 'healthy' };
        } catch (err) {
            this.log(`❌ Anomaly detection failed: ${err.message}`, 'error');
            return { status: 'error', error: err.message };
        }
    }

    async run() {
        this.log('🔮 Predictive Alerts Starting...\n');

        const results = {
            timestamp: new Date().toISOString(),
            checks: {},
            alerts: []
        };

        // Run all predictive checks
        results.checks.errorTrend = await this.analyzeErrorTrend();
        results.checks.resourceTrends = await this.checkResourceTrends();
        results.checks.anomalies = await this.detectAnomalies();

        results.alerts = this.alerts;

        // Save report
        const reportPath = path.join(__dirname, 'predictive-alerts-latest.json');
        fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

        // Summary
        this.log('\n' + '='.repeat(60));
        this.log('📊 PREDICTIVE ALERTS SUMMARY\n');
        this.log(`Total alerts: ${this.alerts.length}`);

        if (this.alerts.length > 0) {
            this.log('\n🚨 Active Alerts:');
            this.alerts.forEach(alert => {
                this.log(`   [${alert.severity.toUpperCase()}] ${alert.message}`);
                this.log(`   Prediction: ${alert.prediction}`);
            });
        } else {
            this.log('✅ No predictive alerts');
        }

        this.log(`\nReport saved: ${reportPath}`);

        return results;
    }
}

// Run predictive alerts
const predictor = new PredictiveAlerts();
predictor.run()
    .then(results => {
        process.exit(results.alerts.length > 0 ? 1 : 0);
    })
    .catch(err => {
        console.error('FATAL:', err);
        process.exit(1);
    });
