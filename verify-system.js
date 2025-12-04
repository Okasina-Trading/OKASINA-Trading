import fetch from 'node-fetch';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const API_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:5173';

async function runVerification() {
    console.log('🔍 Starting System Verification...\n');
    const results = {
        frontend: 'PENDING',
        backend: 'PENDING',
        database: 'PENDING',
        visionAgent: 'PENDING',
        crudFlow: 'PENDING'
    };

    // 1. Check Frontend Availability
    try {
        console.log('1️⃣ Checking Frontend...');
        const res = await fetch(FRONTEND_URL);
        if (res.ok) {
            console.log('✅ Frontend is reachable (HTTP 200)');
            results.frontend = 'PASS';
        } else {
            console.error(`❌ Frontend returned ${res.status}`);
            results.frontend = 'FAIL';
        }
    } catch (e) {
        console.error('❌ Frontend unreachable:', e.message);
        results.frontend = 'FAIL';
    }

    // 2. Check Backend Health (via Test Endpoint)
    try {
        console.log('\n2️⃣ Checking Backend...');
        // Assuming /api/test exists based on test-api.js, if not we'll try /api/products
        const res = await fetch(`${API_URL}/api/test`);
        if (res.ok) {
            console.log('✅ Backend is reachable');
            results.backend = 'PASS';
        } else {
            // Fallback to products if test endpoint doesn't exist
            const res2 = await fetch(`${API_URL}/api/products`);
            if (res2.ok) {
                console.log('✅ Backend is reachable (via /api/products)');
                results.backend = 'PASS';
            } else {
                console.error(`❌ Backend returned ${res.status}`);
                results.backend = 'FAIL';
            }
        }
    } catch (e) {
        console.error('❌ Backend unreachable:', e.message);
        results.backend = 'FAIL';
    }

    // 3. Test Vision Agent Endpoint
    try {
        console.log('\n3️⃣ Testing Vision Agent Endpoint...');
        const payload = {
            imageUrl: 'https://via.placeholder.com/150',
            rawDetails: 'Test Blue Dress'
        };

        const res = await fetch(`${API_URL}/api/ai-agent/jarvis/vision`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok && data.success) {
            console.log('✅ Vision Agent responded successfully');
            console.log('   Generated Product:', data.product.name);
            results.visionAgent = 'PASS';
        } else {
            console.error('❌ Vision Agent failed:', data.error || res.statusText);
            results.visionAgent = 'FAIL';
        }
    } catch (e) {
        console.error('❌ Vision Agent error:', e.message);
        results.visionAgent = 'FAIL';
    }

    // 4. Run CRUD Flow (External Script)
    try {
        console.log('\n4️⃣ Running CRUD Flow Test...');
        const { stdout, stderr } = await execAsync('node test-crud-flow.js');
        console.log(stdout);
        if (stderr) console.error(stderr);

        if (stdout.includes('CRUD Test Flow Complete')) {
            results.crudFlow = 'PASS';
            results.database = 'PASS'; // CRUD implies DB is working
        } else {
            results.crudFlow = 'FAIL';
        }
    } catch (e) {
        console.error('❌ CRUD Flow failed:', e.message);
        results.crudFlow = 'FAIL';
    }

    console.log('\n📊 Verification Summary:');
    console.table(results);
}

runVerification();
