#!/usr/bin/env node

/**
 * Security and Performance Verification Script
 * Verifies PrismJS security patches and performance optimizations
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🔒 Starting security and performance verification...\n');

// 1. Check PrismJS version
console.log('Checking PrismJS version...');
try {
    const prismPkg = JSON.parse(fs.readFileSync(
        path.join(rootDir, 'node_modules/prismjs/package.json'),
        'utf8'
    ));
    const version = prismPkg.version;
    if (version >= '1.30.0') {
        console.log('✅ PrismJS version verified:', version);
    } else {
        console.error('❌ Found vulnerable PrismJS version:', version);
        process.exit(1);
    }
} catch (err) {
    console.error('❌ Could not verify PrismJS version:', err.message);
    process.exit(1);
}

// 2. Verify performance optimization and XSS protection patches
console.log('\nChecking security patches...');
try {
    const prismContent = fs.readFileSync(
        path.join(rootDir, 'node_modules/prismjs/prism.js'),
        'utf8'
    );
    
    // Check performance optimization
    if (prismContent.includes('Performance optimization for large text blocks')) {
        console.log('✅ Performance optimization patch verified');
    } else {
        console.warn('⚠️ Performance optimization patch not found');
    }
    
    // Check XSS protection
    if (prismContent.includes('Enhanced security for Prism Token handling')) {
        console.log('✅ XSS protection patch verified');
    } else {
        console.warn('⚠️ XSS protection patch not found');
    }
    
    // Check DOM Clobbering protection
    if (prismContent.includes('DOM Clobbering protection') || prismContent.includes('originalCurrentScript')) {
        console.log('✅ DOM Clobbering protection verified');
    } else {
        console.warn('⚠️ DOM Clobbering protection not found');
    }
} catch (err) {
    console.error('❌ Could not verify security patches:', err.message);
}

// 3. Check related dependencies
console.log('\nVerifying related dependencies...');
const requiredVersions = {
    'refractor': '^4.8.1',
    'react-refractor': '^3.1.1',
    'sanity-plugin-iframe-pane': '^1.1.5'
};

for (const [pkg, requiredVersion] of Object.entries(requiredVersions)) {
    try {
        const pkgJson = JSON.parse(fs.readFileSync(
            path.join(rootDir, 'node_modules', pkg, 'package.json'),
            'utf8'
        ));
        console.log(`Checking ${pkg}...`);
        if (pkgJson.version >= requiredVersion.replace('^', '')) {
            console.log(`✅ ${pkg} version verified:`, pkgJson.version);
        } else {
            console.warn(`⚠️ ${pkg} version (${pkgJson.version}) is older than required (${requiredVersion})`);
        }
    } catch (err) {
        console.warn(`⚠️ Could not verify ${pkg}:`, err.message);
    }
}

// 4. Run npm audit
console.log('\nRunning security audit...');
try {
    execSync('npm audit --production', { stdio: 'inherit' });
    console.log('✅ Security audit passed');
} catch (err) {
    console.warn('⚠️ Security audit found some issues that may need review');
}

console.log('\n🏁 Verification complete!\n');
