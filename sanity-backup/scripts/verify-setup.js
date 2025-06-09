#!/usr/bin/env node

/**
 * Sanity Setup Validation Script
 * Verifies the Sanity Studio configuration and dependencies
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createClient } from '@sanity/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🔍 Starting Sanity configuration verification...\n');

// 1. Check required environment variables
console.log('Checking environment variables...');
const requiredEnvVars = [
  'SANITY_STUDIO_PROJECT_ID',
  'SANITY_STUDIO_DATASET',
  'SANITY_PREVIEW_SECRET',
  'NEXT_PUBLIC_FRONTEND_URL'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.warn('⚠️ Missing environment variables:', missingEnvVars.join(', '));
} else {
  console.log('✅ All required environment variables are set');
}

// 2. Verify Sanity client connection
console.log('\nVerifying Sanity client connection...');
try {
  const client = createClient({
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'sc70w3cr',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
    useCdn: false,
    apiVersion: '2024-05-15'
  });

  await client.fetch('*[_type == "sanity.imageAsset"][0]');
  console.log('✅ Sanity client connection successful');
} catch (err) {
  console.error('❌ Sanity client connection failed:', err.message);
}

// 3. Check schema files
console.log('\nValidating schema files...');
const schemaDir = path.join(rootDir, 'schemas');
const requiredSchemas = [
  'listing.js',
  'accommodationDetails.js',
  'coworkingDetails.js',
  'restaurantDetails.js',
  'cafeDetails.js',
  'user.js',
  'review.js'
];

const missingSchemas = requiredSchemas.filter(schema => 
  !fs.existsSync(path.join(schemaDir, schema))
);

if (missingSchemas.length > 0) {
  console.warn('⚠️ Missing schema files:', missingSchemas.join(', '));
} else {
  console.log('✅ All required schema files present');
}

// 4. Verify dependencies
console.log('\nChecking dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync(
    path.join(rootDir, 'package.json'),
    'utf8'
  ));

  const requiredDeps = {
    '@sanity/client': '^6.12.0',
    '@sanity/vision': '^3.26.0',
    'sanity': '^3.26.0',
    'sanity-plugin-media': '^3.1.0'
  };

  let hasVersionIssues = false;
  Object.entries(requiredDeps).forEach(([dep, minVersion]) => {
    const currentVersion = packageJson.dependencies[dep];
    if (!currentVersion) {
      console.warn(`⚠️ Missing dependency: ${dep}`);
      hasVersionIssues = true;
    } else if (currentVersion.replace('^', '') < minVersion.replace('^', '')) {
      console.warn(`⚠️ Outdated dependency: ${dep} (${currentVersion} < ${minVersion})`);
      hasVersionIssues = true;
    }
  });

  if (!hasVersionIssues) {
    console.log('✅ All dependencies up to date');
  }
} catch (err) {
  console.error('❌ Error checking dependencies:', err.message);
}

// 5. Check for security vulnerabilities
console.log('\nRunning security check...');
try {
  execSync('npm audit --production', { stdio: 'inherit' });
  console.log('✅ Security check passed');
} catch (err) {
  console.warn('⚠️ Security vulnerabilities found, please review npm audit report');
}

console.log('\n🏁 Verification complete!\n');
