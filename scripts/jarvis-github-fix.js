#!/usr/bin/env node
/**
 * JARVIS GitHub Actions Error Handler
 * Automatically detects and fixes GitHub Actions workflow errors
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🤖 JARVIS GitHub Actions Error Handler\n');

const results = {
    errors: [],
    fixes: [],
    warnings: []
};

// Common GitHub Actions fixes
const fixes = {
    'deprecated-actions': {
        pattern: /uses: actions\/(checkout|setup-node|upload-artifact|github-script)@v[0-3]/g,
        fix: (content) => {
            return content
                .replace(/uses: actions\/checkout@v3/g, 'uses: actions/checkout@v4')
                .replace(/uses: actions\/setup-node@v3/g, 'uses: actions/setup-node@v4')
                .replace(/uses: actions\/upload-artifact@v3/g, 'uses: actions/upload-artifact@v4')
                .replace(/uses: actions\/github-script@v6/g, 'uses: actions/github-script@v7');
        },
        description: 'Updated deprecated GitHub Actions to latest versions'
    },
    'missing-env-vars': {
        pattern: /process\.env\.(\w+)/g,
        fix: (content) => {
            // Add validation for environment variables
            const envVars = [...content.matchAll(/process\.env\.(\w+)/g)].map(m => m[1]);
            const uniqueVars = [...new Set(envVars)];

            console.log(`📋 Found ${uniqueVars.length} environment variables`);
            uniqueVars.forEach(v => console.log(`   - ${v}`));

            return content; // Don't auto-fix, just report
        },
        description: 'Detected environment variables that need GitHub Secrets'
    },
    'node-version': {
        pattern: /node-version: ['"]?1[0-7]['"]?/g,
        fix: (content) => {
            return content.replace(/node-version: ['"]?1[0-7]['"]?/g, 'node-version: "18"');
        },
        description: 'Updated Node.js version to 18 (minimum supported)'
    }
};

// Check workflow files
function checkWorkflows() {
    const workflowDir = '.github/workflows';

    if (!fs.existsSync(workflowDir)) {
        console.log('⚠️  No .github/workflows directory found');
        return;
    }

    const files = fs.readdirSync(workflowDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));

    console.log(`📁 Found ${files.length} workflow files\n`);

    files.forEach(file => {
        const filePath = path.join(workflowDir, file);
        console.log(`🔍 Checking ${file}...`);

        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        let appliedFixes = [];

        // Apply each fix
        for (const [name, fixDef] of Object.entries(fixes)) {
            if (fixDef.pattern.test(content)) {
                const newContent = fixDef.fix(content);
                if (newContent !== content) {
                    content = newContent;
                    modified = true;
                    appliedFixes.push(fixDef.description);
                    console.log(`   ✅ ${fixDef.description}`);
                }
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, content);
            results.fixes.push({
                file,
                fixes: appliedFixes
            });
            console.log(`   💾 Saved fixes to ${file}`);
        } else {
            console.log(`   ✅ No issues found`);
        }

        console.log('');
    });
}

// Check for missing GitHub Secrets
function checkGitHubSecrets() {
    console.log('🔐 Checking GitHub Secrets Configuration\n');

    const requiredSecrets = [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const optionalSecrets = [
        'GOOGLE_AI_KEY',
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET'
    ];

    console.log('Required Secrets:');
    requiredSecrets.forEach(secret => {
        if (process.env[secret]) {
            console.log(`   ✅ ${secret} is set`);
        } else {
            console.log(`   ❌ ${secret} is MISSING`);
            results.errors.push(`Missing required secret: ${secret}`);
        }
    });

    console.log('\nOptional Secrets:');
    optionalSecrets.forEach(secret => {
        if (process.env[secret]) {
            console.log(`   ✅ ${secret} is set`);
        } else {
            console.log(`   ⚠️  ${secret} not set (feature disabled)`);
            results.warnings.push(`Optional secret not set: ${secret}`);
        }
    });

    if (results.errors.length > 0) {
        console.log('\n📝 To fix missing secrets:');
        console.log('   1. Go to GitHub → Settings → Secrets → Actions');
        console.log('   2. Add each missing secret');
        console.log('   3. Re-run the workflow\n');
    }
}

// Auto-commit fixes
function autoCommitFixes() {
    if (results.fixes.length === 0) {
        return;
    }

    console.log('💾 Auto-committing fixes...\n');

    try {
        execSync('git add .github/workflows/', { stdio: 'inherit' });
        execSync('git commit -m "fix: JARVIS auto-fixed GitHub Actions workflows"', { stdio: 'inherit' });
        console.log('✅ Fixes committed');

        // Don't auto-push, let user review
        console.log('⚠️  Run `git push` to deploy fixes\n');
    } catch (error) {
        console.log('⚠️  No changes to commit or git error\n');
    }
}

// Generate report
function generateReport() {
    console.log('='.repeat(60));
    console.log('📊 JARVIS GitHub Actions Error Handler - Report');
    console.log('='.repeat(60));

    console.log(`\n✅ Fixes Applied: ${results.fixes.length}`);
    results.fixes.forEach(fix => {
        console.log(`   📄 ${fix.file}`);
        fix.fixes.forEach(f => console.log(`      - ${f}`));
    });

    console.log(`\n❌ Errors Found: ${results.errors.length}`);
    results.errors.forEach(err => console.log(`   - ${err}`));

    console.log(`\n⚠️  Warnings: ${results.warnings.length}`);
    results.warnings.forEach(warn => console.log(`   - ${warn}`));

    console.log('\n' + '='.repeat(60));

    if (results.fixes.length > 0) {
        console.log('✨ JARVIS fixed GitHub Actions issues!');
    } else if (results.errors.length === 0) {
        console.log('🎉 No issues found - workflows are healthy!');
    } else {
        console.log('⚠️  Manual fixes required');
    }

    console.log('='.repeat(60) + '\n');
}

// Main execution
async function main() {
    checkWorkflows();
    checkGitHubSecrets();
    autoCommitFixes();
    generateReport();

    process.exit(results.errors.length > 0 ? 1 : 0);
}

main().catch(console.error);
