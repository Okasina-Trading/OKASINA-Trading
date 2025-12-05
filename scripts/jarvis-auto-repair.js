#!/usr/bin/env node
/**
 * JARVIS Auto-Repair System
 * Automatically detects and fixes common issues
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

console.log('🤖 JARVIS Auto-Repair System Starting...\n');

const issues = {
    detected: 0,
    fixed: 0,
    failed: 0
};

const log = (emoji, msg) => console.log(`${emoji} ${msg}`);
const error = (msg) => { log('❌', msg); issues.failed++; };
const fix = (msg) => { log('🔧', msg); issues.fixed++; };
const detect = (msg) => { log('🔍', msg); issues.detected++; };

// Auto-repair functions
const repairs = {
    // 1. Fix missing default sizes
    async fixMissingSizes() {
        try {
            const { data: products } = await supabase
                .from('products')
                .select('id, sizes, category')
                .or('sizes.is.null,sizes.eq.{}');

            if (products && products.length > 0) {
                detect(`Found ${products.length} products without sizes`);

                for (const product of products) {
                    const defaultSizes = product.category === 'Accessories'
                        ? ['One Size']
                        : ['XS', 'S', 'M', 'L', 'XL'];

                    await supabase
                        .from('products')
                        .update({ sizes: defaultSizes })
                        .eq('id', product.id);
                }

                fix(`Added default sizes to ${products.length} products`);
            }
        } catch (err) {
            error(`Failed to fix sizes: ${err.message}`);
        }
    },

    // 2. Fix products without original_price (for discounts)
    async fixMissingOriginalPrices() {
        try {
            const { data: products } = await supabase
                .from('products')
                .select('id, price, original_price')
                .is('original_price', null);

            if (products && products.length > 0) {
                detect(`Found ${products.length} products without original_price`);

                for (const product of products) {
                    // Set original_price same as price (no discount)
                    await supabase
                        .from('products')
                        .update({ original_price: product.price })
                        .eq('id', product.id);
                }

                fix(`Set original_price for ${products.length} products`);
            }
        } catch (err) {
            error(`Failed to fix original prices: ${err.message}`);
        }
    },

    // 3. Fix products with zero or negative stock
    async fixInvalidStock() {
        try {
            const { data: products } = await supabase
                .from('products')
                .select('id, stock_qty')
                .or('stock_qty.is.null,stock_qty.lt.0');

            if (products && products.length > 0) {
                detect(`Found ${products.length} products with invalid stock`);

                for (const product of products) {
                    await supabase
                        .from('products')
                        .update({ stock_qty: 0 })
                        .eq('id', product.id);
                }

                fix(`Fixed stock for ${products.length} products`);
            }
        } catch (err) {
            error(`Failed to fix stock: ${err.message}`);
        }
    },

    // 4. Verify and fix RLS policies
    async checkRLSPolicies() {
        try {
            // Test if we can update products
            const { data: testProduct } = await supabase
                .from('products')
                .select('id')
                .limit(1)
                .single();

            if (testProduct) {
                const { error: updateError } = await supabase
                    .from('products')
                    .update({ updated_at: new Date().toISOString() })
                    .eq('id', testProduct.id);

                if (updateError) {
                    detect('RLS policies may be blocking updates');
                    log('⚠️', 'Manual RLS policy fix may be required in Supabase Dashboard');
                }
            }
        } catch (err) {
            error(`RLS check failed: ${err.message}`);
        }
    },

    // 5. Check for missing environment variables
    async checkEnvironmentVars() {
        const required = [
            'VITE_SUPABASE_URL',
            'VITE_SUPABASE_ANON_KEY',
            'SUPABASE_SERVICE_ROLE_KEY'
        ];

        const missing = required.filter(v => !process.env[v]);

        if (missing.length > 0) {
            detect(`Missing environment variables: ${missing.join(', ')}`);
            log('⚠️', 'Add missing variables to .env file');
        }
    },

    // 6. Fix products without categories
    async fixMissingCategories() {
        try {
            const { data: products } = await supabase
                .from('products')
                .select('id, category')
                .or('category.is.null,category.eq.');

            if (products && products.length > 0) {
                detect(`Found ${products.length} products without category`);

                for (const product of products) {
                    await supabase
                        .from('products')
                        .update({ category: 'Accessories' })
                        .eq('id', product.id);
                }

                fix(`Set default category for ${products.length} products`);
            }
        } catch (err) {
            error(`Failed to fix categories: ${err.message}`);
        }
    },

    // 7. Clean up draft products older than 30 days
    async cleanOldDrafts() {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: oldDrafts } = await supabase
                .from('products')
                .select('id')
                .eq('status', 'draft')
                .lt('created_at', thirtyDaysAgo.toISOString());

            if (oldDrafts && oldDrafts.length > 0) {
                detect(`Found ${oldDrafts.length} old draft products`);
                log('ℹ️', 'Consider cleaning up old drafts manually');
            }
        } catch (err) {
            error(`Failed to check drafts: ${err.message}`);
        }
    },

    // 8. Verify deployment status
    async checkDeployment() {
        try {
            // Check if the site is accessible
            const response = await fetch('https://okasinatrading.com', {
                method: 'HEAD',
                timeout: 5000
            });

            if (response.ok) {
                log('✅', 'Site is accessible');
            } else {
                detect(`Site returned status ${response.status}`);
            }
        } catch (err) {
            error(`Site check failed: ${err.message}`);
        }
    }
};

// Run all repairs
async function runAutoRepair() {
    console.log('🔧 Running Auto-Repair Sequence...\n');

    await repairs.fixMissingSizes();
    await repairs.fixMissingOriginalPrices();
    await repairs.fixInvalidStock();
    await repairs.fixMissingCategories();
    await repairs.checkRLSPolicies();
    await repairs.checkEnvironmentVars();
    await repairs.cleanOldDrafts();
    await repairs.checkDeployment();

    console.log('\n' + '='.repeat(50));
    console.log('📊 Auto-Repair Summary:');
    console.log(`   🔍 Issues Detected: ${issues.detected}`);
    console.log(`   🔧 Issues Fixed: ${issues.fixed}`);
    console.log(`   ❌ Failed: ${issues.failed}`);
    console.log('='.repeat(50));

    if (issues.fixed > 0) {
        console.log('\n✨ JARVIS automatically fixed issues!');
    }

    if (issues.detected > issues.fixed) {
        console.log('\n⚠️  Some issues require manual attention');
    }

    console.log('\n🤖 JARVIS Auto-Repair Complete\n');
}

// Run the auto-repair
runAutoRepair().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
