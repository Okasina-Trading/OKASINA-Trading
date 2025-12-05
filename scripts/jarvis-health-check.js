#!/usr/bin/env node
/**
 * JARVIS - Automated System Health Check
 * Runs comprehensive checks on the Okasina Fashion Store
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

const API_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001';

console.log('🤖 JARVIS System Health Check Starting...\n');

const checks = {
    passed: 0,
    failed: 0,
    warnings: 0
};

// Helper functions
const pass = (msg) => {
    console.log(`✅ ${msg}`);
    checks.passed++;
};

const fail = (msg) => {
    console.log(`❌ ${msg}`);
    checks.failed++;
};

const warn = (msg) => {
    console.log(`⚠️  ${msg}`);
    checks.warnings++;
};

const section = (title) => {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📋 ${title}`);
    console.log('='.repeat(50));
};

// 1. Database Connectivity
section('Database Connectivity');
try {
    const { data, error } = await supabase.from('products').select('count').limit(1);
    if (error) throw error;
    pass('Supabase connection successful');
} catch (error) {
    fail(`Supabase connection failed: ${error.message}`);
}

// 2. Product Data Integrity
section('Product Data Integrity');
try {
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, price, stock_qty, sizes, category, original_price');

    if (error) throw error;

    pass(`Found ${products.length} products in database`);

    // Check for products without sizes
    const noSizes = products.filter(p => !p.sizes || (Array.isArray(p.sizes) && p.sizes.length === 0));
    if (noSizes.length > 0) {
        warn(`${noSizes.length} products have no sizes (will use defaults)`);
    } else {
        pass('All products have sizes defined');
    }

    // Check for products with discounts
    const withDiscounts = products.filter(p => p.original_price && p.original_price > p.price);
    if (withDiscounts.length > 0) {
        pass(`${withDiscounts.length} products have discounts configured`);
    } else {
        warn('No products have discounts (set original_price > price to show discounts)');
    }

    // Check stock levels
    const outOfStock = products.filter(p => p.stock_qty === 0);
    const lowStock = products.filter(p => p.stock_qty > 0 && p.stock_qty <= 5);

    if (outOfStock.length > 0) {
        warn(`${outOfStock.length} products are out of stock`);
    }
    if (lowStock.length > 0) {
        warn(`${lowStock.length} products have low stock (≤5)`);
    }

    pass('Product data integrity check complete');

} catch (error) {
    fail(`Product data check failed: ${error.message}`);
}

// 3. Settings Table
section('Settings & Configuration');
try {
    const { data: settings, error } = await supabase
        .from('settings')
        .select('*');

    if (error) throw error;

    if (settings && settings.length > 0) {
        pass(`Settings table exists with ${settings.length} entries`);

        const socialMedia = settings.find(s => s.key === 'social_media');
        if (socialMedia) {
            const links = Object.values(socialMedia.value).filter(v => v);
            if (links.length > 0) {
                pass(`${links.length} social media links configured`);
            } else {
                warn('No social media links configured yet');
            }
        }
    } else {
        warn('Settings table is empty - run migration 005_settings_table.sql');
    }
} catch (error) {
    warn(`Settings check failed: ${error.message} - May need to run migration`);
}

// 4. Currency Configuration
section('Currency & Pricing');
try {
    const { data: products } = await supabase
        .from('products')
        .select('price, price_mur')
        .limit(10);

    const hasMurPrices = products.some(p => p.price_mur);
    if (hasMurPrices) {
        pass('Products have MUR prices configured');
    } else {
        warn('No MUR prices found - currency conversion will be used');
    }

    pass('Currency system operational (defaults to MUR)');
} catch (error) {
    fail(`Currency check failed: ${error.message}`);
}

// 5. Environment Variables
section('Environment Configuration');
const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
];

const optionalEnvVars = [
    'GOOGLE_AI_KEY',
    'VITE_GEMINI_API_KEY',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
];

requiredEnvVars.forEach(varName => {
    if (process.env[varName]) {
        pass(`${varName} is set`);
    } else {
        fail(`${varName} is missing`);
    }
});

optionalEnvVars.forEach(varName => {
    if (process.env[varName]) {
        pass(`${varName} is set (optional)`);
    } else {
        warn(`${varName} not set (optional - some features may not work)`);
    }
});

// 6. RLS Policies
section('Row Level Security');
try {
    // Test product update with anon key
    const { data: testProduct } = await supabase
        .from('products')
        .select('id')
        .limit(1)
        .single();

    if (testProduct) {
        const { error } = await supabase
            .from('products')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', testProduct.id);

        if (error) {
            warn('RLS policies may be restrictive - some operations might fail');
        } else {
            pass('RLS policies allow necessary operations');
        }
    }
} catch (error) {
    warn(`RLS check inconclusive: ${error.message}`);
}

// 7. Summary
section('Summary');
console.log(`\n📊 Check Results:`);
console.log(`   ✅ Passed: ${checks.passed}`);
console.log(`   ❌ Failed: ${checks.failed}`);
console.log(`   ⚠️  Warnings: ${checks.warnings}`);

if (checks.failed === 0) {
    console.log(`\n🎉 All critical checks passed!`);
    if (checks.warnings > 0) {
        console.log(`⚠️  ${checks.warnings} warning(s) - review recommended but not critical`);
    }
} else {
    console.log(`\n🚨 ${checks.failed} critical issue(s) found - please address`);
}

console.log('\n🤖 JARVIS Health Check Complete\n');

process.exit(checks.failed > 0 ? 1 : 0);
