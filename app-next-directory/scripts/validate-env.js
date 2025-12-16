#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates all required environment variables for the authentication system
 */

import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Import structuredLogger for logging
let structuredLogger;
try {
  structuredLogger = require('../src/lib/logger').structuredLogger;
} catch (_error) {
  // Fallback to stdout/stderr for standalone usage (avoid console.*)
  structuredLogger = {
    info: (...args) => process.stdout.write(args.map(String).join(' ') + '\n'),
    warn: (...args) => process.stderr.write(args.map(String).join(' ') + '\n'),
  };
}

export function validateEnvironment() {
  process.stdout.write('🔍 Environment Validation for Phase 1 Integration\n\n');

  const requiredVars = [
    {
      name: 'NEXTAUTH_URL',
      value: process.env.NEXTAUTH_URL,
      description: 'NextAuth.js base URL',
      example: 'http://localhost:3000',
    },
    {
      name: 'NEXTAUTH_SECRET',
      value: process.env.NEXTAUTH_SECRET,
      description: 'NextAuth.js encryption secret',
      example: 'base64-encoded-32-byte-string',
    },
    {
      name: 'MONGODB_URI',
      value: process.env.MONGODB_URI,
      description: 'MongoDB connection string',
      example: 'mongodb+srv://user:pass@cluster.mongodb.net/dbname',
    },
  ];

  const sanityVars = [
    {
      name: 'NEXT_PUBLIC_SANITY_PROJECT_ID',
      value: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      description: 'Sanity project ID',
      required: false,
    },
    {
      name: 'NEXT_PUBLIC_SANITY_DATASET',
      value: process.env.NEXT_PUBLIC_SANITY_DATASET,
      description: 'Sanity dataset (e.g., production)',
      required: false,
    },
    {
      name: 'SANITY_API_TOKEN',
      value: process.env.SANITY_API_TOKEN,
      description: 'Sanity API token',
      required: false,
    },
  ];

  let allValid = true;

  process.stdout.write('🔐 Authentication Variables:\n');
  requiredVars.forEach(variable => {
    const isValid = variable.value && variable.value.length > 0;
    const status = isValid ? '✅' : '❌';
    process.stdout.write(
      `   ${status} ${variable.name}: ${isValid ? '✓ Configured' : '❌ Missing'}\n`
    );

    if (!isValid) {
      process.stdout.write(`      Description: ${variable.description}\n`);
      process.stdout.write(`      Example: ${variable.example}\n`);
      allValid = false;
    }
  });

  process.stdout.write('\n📊 CMS Variables:\n');
  sanityVars.forEach(variable => {
    const isValid = variable.value && variable.value.length > 0;
    const status = isValid ? '✅' : '○';
    process.stdout.write(
      `   ${status} ${variable.name}: ${isValid ? '✓ Configured' : '○ Optional'}\n`
    );
  });

  const oauthVars = [
    {
      name: 'GOOGLE_CLIENT_ID',
      value: process.env.GOOGLE_CLIENT_ID,
      description: 'Google OAuth client ID',
      required: false,
    },
    {
      name: 'GOOGLE_CLIENT_SECRET',
      value: process.env.GOOGLE_CLIENT_SECRET,
      description: 'Google OAuth client secret',
      required: false,
    },
  ];

  process.stdout.write('\n🌐 Social Sign-In Providers:\n');
  oauthVars.forEach(variable => {
    const isValid = variable.value && variable.value.length > 0;
    const status = isValid ? '✅' : '○';
    process.stdout.write(`   ${status} ${variable.name}: ${isValid ? '✅' : '○ Optional'}\n`);
    if (!isValid) {
      process.stdout.write(`      ${variable.description}\n`);
    }
  });

  process.stdout.write('\n📋 Summary:\n');
  if (allValid) {
    process.stdout.write('🎉 All required environment variables are configured!\n');
    process.stdout.write('🚀 Ready to run integration tests\n');
    process.stdout.write('\nNext steps:\n');
    process.stdout.write('   1. pnpm run test:db-connection\n');
    process.stdout.write('   2. pnpm run test:integration\n');
    process.stdout.write('   3. pnpm dev (start development server)\n');
  } else {
    process.stdout.write('⚠️  Some required environment variables are missing\n');
    process.stdout.write('📖 Please see MONGODB_SETUP.md for configuration instructions\n');
    process.stdout.write('\nQuick setup:\n');
    process.stdout.write('   1. Copy .env.example to .env.local\n');
    process.stdout.write('   2. Configure MONGODB_URI with your database\n');
    process.stdout.write('   3. pnpm run validate:env (after filling values)\n');
  }

  // Log the validation results with structuredLogger as well
  structuredLogger.info('Environment validation completed', {
    allValid,
    requiredCount: requiredVars.length,
    sanityCount: sanityVars.length,
    oauthCount: oauthVars.length,
  });

  return allValid;
}

// Run validation
const isValid = validateEnvironment();
process.exit(isValid ? 0 : 1);
