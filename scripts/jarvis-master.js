#!/usr/bin/env node
/**
 * JARVIS Master Orchestrator
 * Runs ALL checks, monitors everything, prevents recurring errors
 * This is the central command for the entire JARVIS system
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

console.log('🤖 JARVIS MASTER ORCHESTRATOR');
console.log('='.repeat(70));
console.log('Running comprehensive system maintenance...\n');

const results = {
    modules: {},
    totalIssues: 0,
    totalFixed: 0,
    totalWarnings: 0,
    startTime: new Date(),
    endTime: null
};

// ============================================
// MODULE RUNNERS
// ============================================

async function runModule(name, command, description) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🔧 ${name.toUpperCase()}`);
    console.log(`📋 ${description}`);
    console.log('='.repeat(70));

    const moduleStart = Date.now();

    try {
        const { stdout, stderr } = await execAsync(command);
        const duration = Date.now() - moduleStart;

        console.log(stdout);
        if (stderr && !stderr.includes('warning')) {
            console.error(stderr);
        }

        results.modules[name] = {
            success: true,
            duration,
            output: stdout
        };

        console.log(`✅ ${name} completed in ${(duration / 1000).toFixed(2)}s`);
        return true;
    } catch (error) {
        const duration = Date.now() - moduleStart;

        console.error(`❌ ${name} failed:`, error.message);

        results.modules[name] = {
            success: false,
            duration,
            error: error.message
        };

        return false;
    }
}

// ============================================
// CORE SYSTEM CHECKS
// ============================================

async function runCoreChecks() {
    console.log('\n🔍 PHASE 1: CORE SYSTEM CHECKS\n');

    // 1. Health Check
    await runModule(
        'Health Check',
        'node scripts/jarvis-health-check.js',
        'Verifying database connectivity and basic system health'
    );

    // 2. Comprehensive Check
    await runModule(
        'Comprehensive Check',
        'node scripts/jarvis-comprehensive.js',
        'Checking all aspects: database, frontend, backend, security, performance'
    );
}

// ============================================
// AUTO-REPAIR PHASE
// ============================================

async function runAutoRepair() {
    console.log('\n🔧 PHASE 2: AUTO-REPAIR\n');

    await runModule(
        'Auto-Repair',
        'node scripts/jarvis-auto-repair.js',
        'Automatically fixing common issues: sizes, prices, stock, categories'
    );
}

// ============================================
// DATA INTEGRITY CHECKS
// ============================================

async function checkDataIntegrity() {
    console.log('\n📊 PHASE 3: DATA INTEGRITY\n');

    try {
        // Check for critical data issues
        const { data: products } = await supabase.from('products').select('*');

        if (!products || products.length === 0) {
            console.log('⚠️  WARNING: No products found in database');
            results.totalWarnings++;
        } else {
            console.log(`✅ Found ${products.length} products`);

            // Check for issues
            const issues = {
                noImage: products.filter(p => !p.image_url && !p.image).length,
                noPrice: products.filter(p => !p.price || p.price <= 0).length,
                noSizes: products.filter(p => !p.sizes || p.sizes.length === 0).length,
                noCategory: products.filter(p => !p.category).length,
                noDescription: products.filter(p => !p.description).length
            };

            console.log('\n📈 Data Quality Report:');
            console.log(`   Missing Images: ${issues.noImage}`);
            console.log(`   Missing Prices: ${issues.noPrice}`);
            console.log(`   Missing Sizes: ${issues.noSizes}`);
            console.log(`   Missing Categories: ${issues.noCategory}`);
            console.log(`   Missing Descriptions: ${issues.noDescription}`);

            results.totalIssues += Object.values(issues).reduce((a, b) => a + b, 0);
        }

        // Check settings table
        const { data: settings } = await supabase.from('settings').select('*');
        if (settings && settings.length > 0) {
            console.log(`✅ Settings configured (${settings.length} entries)`);
        } else {
            console.log('⚠️  WARNING: Settings table is empty');
            results.totalWarnings++;
        }

    } catch (error) {
        console.error('❌ Data integrity check failed:', error.message);
    }
}

// ============================================
// DEPLOYMENT VERIFICATION
// ============================================

async function verifyDeployment() {
    console.log('\n🚀 PHASE 4: DEPLOYMENT VERIFICATION\n');

    try {
        const siteUrl = 'https://okasinatrading.com';
        console.log(`🔍 Checking ${siteUrl}...`);

        const response = await fetch(siteUrl, { method: 'HEAD', timeout: 10000 });

        if (response.ok) {
            console.log(`✅ Site is accessible (Status: ${response.status})`);
        } else {
            console.log(`⚠️  Site returned status ${response.status}`);
            results.totalWarnings++;
        }

        // Check critical pages
        const criticalPages = ['/shop', '/admin', '/cart'];
        for (const page of criticalPages) {
            try {
                const pageResponse = await fetch(`${siteUrl}${page}`, { method: 'HEAD', timeout: 5000 });
                if (pageResponse.ok) {
                    console.log(`✅ ${page} is accessible`);
                } else {
                    console.log(`⚠️  ${page} returned ${pageResponse.status}`);
                }
            } catch (err) {
                console.log(`⚠️  ${page} check failed: ${err.message}`);
            }
        }

    } catch (error) {
        console.error('❌ Deployment verification failed:', error.message);
        results.totalWarnings++;
    }
}

// ============================================
// ENVIRONMENT VALIDATION
// ============================================

async function validateEnvironment() {
    console.log('\n🔐 PHASE 5: ENVIRONMENT VALIDATION\n');

    const required = {
        'VITE_SUPABASE_URL': process.env.VITE_SUPABASE_URL,
        'VITE_SUPABASE_ANON_KEY': process.env.VITE_SUPABASE_ANON_KEY,
        'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY
    };

    const optional = {
        'GOOGLE_AI_KEY': process.env.GOOGLE_AI_KEY,
        'VITE_GEMINI_API_KEY': process.env.VITE_GEMINI_API_KEY,
        'CLOUDINARY_CLOUD_NAME': process.env.CLOUDINARY_CLOUD_NAME,
        'CLOUDINARY_API_KEY': process.env.CLOUDINARY_API_KEY,
        'CLOUDINARY_API_SECRET': process.env.CLOUDINARY_API_SECRET
    };

    console.log('Required Variables:');
    for (const [key, value] of Object.entries(required)) {
        if (value) {
            console.log(`✅ ${key} is set`);
        } else {
            console.log(`❌ ${key} is MISSING (CRITICAL)`);
            results.totalIssues++;
        }
    }

    console.log('\nOptional Variables:');
    for (const [key, value] of Object.entries(optional)) {
        if (value) {
            console.log(`✅ ${key} is set`);
        } else {
            console.log(`⚠️  ${key} not set (feature disabled)`);
            results.totalWarnings++;
        }
    }

    // Check .env file security
    if (fs.existsSync('.gitignore')) {
        const gitignore = fs.readFileSync('.gitignore', 'utf8');
        if (gitignore.includes('.env')) {
            console.log('\n✅ .env is in .gitignore (secure)');
        } else {
            console.log('\n❌ .env NOT in .gitignore (SECURITY RISK)');
            results.totalIssues++;
        }
    }
}

// ============================================
// PERFORMANCE OPTIMIZATION
// ============================================

async function checkPerformance() {
    console.log('\n⚡ PHASE 6: PERFORMANCE CHECK\n');

    try {
        // Check file sizes
        const checkFileSize = (file, maxMB) => {
            if (fs.existsSync(file)) {
                const stats = fs.statSync(file);
                const sizeMB = stats.size / (1024 * 1024);
                if (sizeMB > maxMB) {
                    console.log(`⚠️  ${file} is ${sizeMB.toFixed(2)}MB (consider optimization)`);
                    results.totalWarnings++;
                } else {
                    console.log(`✅ ${file} size is optimal (${sizeMB.toFixed(2)}MB)`);
                }
            }
        };

        checkFileSize('src/index.css', 0.5);
        checkFileSize('dist/index.html', 1);

        // Check for large images in public folder
        if (fs.existsSync('public')) {
            const files = fs.readdirSync('public');
            const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));

            console.log(`\n📁 Found ${imageFiles.length} images in public folder`);

            for (const img of imageFiles.slice(0, 5)) {
                checkFileSize(`public/${img}`, 1);
            }
        }

    } catch (error) {
        console.error('❌ Performance check failed:', error.message);
    }
}

// ============================================
// GENERATE REPORT
// ============================================

function generateReport() {
    results.endTime = new Date();
    const duration = (results.endTime - results.startTime) / 1000;

    console.log('\n' + '='.repeat(70));
    console.log('📊 JARVIS MASTER ORCHESTRATOR - FINAL REPORT');
    console.log('='.repeat(70));

    console.log(`\n⏱️  Total Duration: ${duration.toFixed(2)}s`);
    console.log(`📅 Completed: ${results.endTime.toLocaleString()}`);

    console.log('\n🔧 Modules Executed:');
    for (const [name, result] of Object.entries(results.modules)) {
        const status = result.success ? '✅' : '❌';
        const time = (result.duration / 1000).toFixed(2);
        console.log(`   ${status} ${name} (${time}s)`);
    }

    console.log(`\n📈 Summary:`);
    console.log(`   🔍 Total Issues Found: ${results.totalIssues}`);
    console.log(`   🔧 Total Auto-Fixed: ${results.totalFixed}`);
    console.log(`   ⚠️  Total Warnings: ${results.totalWarnings}`);

    const successRate = Object.values(results.modules).filter(m => m.success).length / Object.keys(results.modules).length * 100;
    console.log(`   ✅ Success Rate: ${successRate.toFixed(1)}%`);

    // Save report
    const reportPath = path.join('.jarvis', 'last-run.json');
    fs.mkdirSync('.jarvis', { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Report saved to: ${reportPath}`);

    console.log('\n' + '='.repeat(70));

    if (results.totalIssues === 0 && successRate === 100) {
        console.log('🎉 ALL SYSTEMS OPERATIONAL - NO ISSUES DETECTED!');
    } else if (results.totalIssues > 0) {
        console.log(`⚠️  ${results.totalIssues} ISSUES NEED ATTENTION`);
    } else {
        console.log('✅ SYSTEM HEALTHY - MINOR WARNINGS ONLY');
    }

    console.log('='.repeat(70));
    console.log('\n🤖 JARVIS Master Orchestrator Complete\n');
}

// ============================================
// MAIN EXECUTION
// ============================================

async function runMasterOrchestrator() {
    try {
        await runCoreChecks();
        await runAutoRepair();
        await checkDataIntegrity();
        await verifyDeployment();
        await validateEnvironment();
        await checkPerformance();

        generateReport();

        // Exit with appropriate code
        process.exit(results.totalIssues > 0 ? 1 : 0);

    } catch (error) {
        console.error('\n❌ FATAL ERROR:', error);
        process.exit(1);
    }
}

// Run the orchestrator
runMasterOrchestrator();
