import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Integrated JARVIS monitoring loop
// Runs: Health Check → Error Detection → Auto-Fix → Repeat
// Safety: No overlapping runs (sequential execution)

let isRunning = false;

async function runIntegratedMonitoring() {
    console.log('🤖 JARVIS Integrated Monitoring Starting...\n');
    console.log('Loop: Health Check → Error Detection → Auto-Fix');
    console.log('Interval: 5 minutes');
    console.log('Safety: No overlapping runs');
    console.log('Press Ctrl+C to stop\n');

    let iteration = 0;

    while (true) {
        if (isRunning) {
            console.log('⚠️  Previous cycle still running, skipping this iteration');
            await new Promise(resolve => setTimeout(resolve, 60 * 1000)); // Wait 1 min and check again
            continue;
        }

        isRunning = true;
        iteration++;
        const timestamp = new Date().toISOString();
        console.log(`\n${'='.repeat(60)}`);
        console.log(`[${timestamp}] Iteration #${iteration}`);
        console.log('='.repeat(60));

        try {
            // Step 1: Run Tier 1 Health Check
            console.log('\n1️⃣ Running Tier 1 Health Check...');
            const { stdout: healthOutput } = await execAsync('node scripts/jarvis-tier1-health.js');
            console.log(healthOutput);

            // Step 2: Run Error Detection
            console.log('\n2️⃣ Running Error Detection...');
            const { stdout: errorOutput } = await execAsync('node scripts/error-detector.js');
            console.log(errorOutput);

            // Step 3: Run Auto-Fix (if errors detected)
            console.log('\n3️⃣ Running Auto-Fix...');
            const { stdout: fixOutput } = await execAsync('node scripts/okasina-auto-fix.js');
            console.log(fixOutput);

            console.log('\n✅ Monitoring cycle complete');

        } catch (err) {
            console.error('\n❌ Monitoring cycle error:', err.message);
            // Continue monitoring even if one cycle fails
        } finally {
            isRunning = false;
        }

        // Wait 5 minutes
        console.log('\n⏳ Waiting 5 minutes until next check...');
        await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
    }
}

// Start monitoring
runIntegratedMonitoring().catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
});
