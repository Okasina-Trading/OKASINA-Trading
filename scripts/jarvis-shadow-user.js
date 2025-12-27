import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

// Colors for console
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${GREEN}🕵️  JARVIS SHADOW USER PROTOCOL INITIATED${RESET}`);
console.log("------------------------------------------------");
console.log("Mission: Verify 'Browse -> Cart -> Checkout' flow on local environment.");

// Verify server is running? 
// For now, we assume Master Orchestrator or User has server running.
// We default to port 5173 (Vite Dev) or 4173 (Preview)

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";
console.log(`Target: ${BASE_URL}\n`);

// Use cross-platform env var mapped in options, not command string
const cmd = `npx playwright test tests/shadow-user.spec.js --reporter=list`;

exec(cmd, { env: { ...process.env, BASE_URL } }, (error, stdout, stderr) => {
    if (error) {
        console.error(`${RED}❌ SHADOW USER FAILED${RESET}`);
        console.error("Critical Flow Broken: Checkout possibly down.");
        console.error(stdout);
        console.error(stderr);
        process.exit(1);
    } else {
        console.log(`${GREEN}✅ SHADOW USER SUCCESS${RESET}`);
        console.log("Core functional path is operational.");
        // console.log(stdout); // Optional: verbose output
        process.exit(0);
    }
});
