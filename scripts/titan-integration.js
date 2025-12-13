import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class TITANIntegration {
    constructor() {
        this.titanLogsPath = 'F:\\AION-ZERO\\logs\\okasina';
        this.titanInboxPath = 'F:\\AION-ZERO\\inbox\\okasina';
        this.fallbackLogsPath = path.join(__dirname, '../logs/titan-fallback');
        this.fallbackInboxPath = path.join(__dirname, '../logs/titan-inbox-fallback');
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    }

    ensureDirectory(dirPath, fallbackPath) {
        try {
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                this.log(`✅ Created directory: ${dirPath}`);
            }
            return dirPath;
        } catch (err) {
            this.log(`⚠️  TITAN path not accessible, using fallback: ${err.message}`, 'warn');
            if (!fs.existsSync(fallbackPath)) {
                fs.mkdirSync(fallbackPath, { recursive: true });
            }
            return fallbackPath;
        }
    }

    ensureLogDirectory() {
        return this.ensureDirectory(this.titanLogsPath, this.fallbackLogsPath);
    }

    ensureInboxDirectory() {
        return this.ensureDirectory(this.titanInboxPath, this.fallbackInboxPath);
    }

    async saveHealthReport(report, tier = 'tier1') {
        const logDir = this.ensureLogDirectory();
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const filename = `health-${tier}-${timestamp}.json`;
        const filepath = path.join(logDir, filename);

        try {
            fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
            this.log(`✅ Saved to TITAN: ${filename}`);
            return filepath;
        } catch (err) {
            this.log(`❌ Failed to save to TITAN: ${err.message}`, 'error');
            return null;
        }
    }

    async saveErrorReport(errors) {
        const logDir = this.ensureLogDirectory();
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const filename = `errors-${timestamp}.json`;
        const filepath = path.join(logDir, filename);

        try {
            fs.writeFileSync(filepath, JSON.stringify(errors, null, 2));
            this.log(`✅ Saved errors to TITAN: ${filename}`);
            return filepath;
        } catch (err) {
            this.log(`❌ Failed to save errors: ${err.message}`, 'error');
            return null;
        }
    }

    async saveAlertReport(alerts) {
        const logDir = this.ensureLogDirectory();
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const filename = `alerts-${timestamp}.json`;
        const filepath = path.join(logDir, filename);

        try {
            fs.writeFileSync(filepath, JSON.stringify(alerts, null, 2));
            this.log(`✅ Saved alerts to TITAN: ${filename}`);
            return filepath;
        } catch (err) {
            this.log(`❌ Failed to save alerts: ${err.message}`, 'error');
            return null;
        }
    }

    async test() {
        this.log('🔗 Testing TITAN Command Integration...\n');

        const testReport = {
            test: true,
            timestamp: new Date().toISOString(),
            message: 'OKASINA → TITAN integration test'
        };

        const result = await this.saveHealthReport(testReport, 'test');

        if (result) {
            this.log('\n✅ TITAN Integration: OPERATIONAL');
            this.log(`   Logs directory: ${this.ensureLogDirectory()}`);
            return true;
        } else {
            this.log('\n❌ TITAN Integration: FAILED');
            return false;
        }
    }
}

// Test integration
const titan = new TITANIntegration();
titan.test().then(success => {
    process.exit(success ? 0 : 1);
});

export default TITANIntegration;
