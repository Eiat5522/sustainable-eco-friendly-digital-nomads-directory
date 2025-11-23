#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates all required environment variables for the authentication system
 */

require('dotenv').config({ path: '.env.local' });

function validateEnvironment() {
  console.log('🔍 Environment Validation for Phase 1 Integration\n');

  const requiredVars = [
    {
      name: 'NEXTAUTH_URL',
      value: process.env.NEXTAUTH_URL,
      description: 'NextAuth.js base URL',
      example: 'http://localhost:3000'
    },
    {
      name: 'NEXTAUTH_SECRET',
      value: process.env.NEXTAUTH_SECRET,
      description: 'NextAuth.js encryption secret',
      example: 'base64-encoded-32-byte-string'
    },
    {
      name: 'MONGODB_URI',
      value: process.env.MONGODB_URI,
      description: 'MongoDB connection string',
      example: 'mongodb+srv://user:pass@cluster.mongodb.net/dbname'
    }
  ];

  const sanityVars = [
    {
      name: 'NEXT_PUBLIC_SANITY_PROJECT_ID',
      value: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      description: 'Sanity project ID',
      required: false
    },
    {
      name: 'SANITY_API_TOKEN',
      value: process.env.SANITY_API_TOKEN,
      description: 'Sanity API token',
      required: false
    }
  ];

  let allValid = true;

  console.log('🔐 Authentication Variables:');
  requiredVars.forEach(variable => {
    const isValid = variable.value && variable.value.length > 0;
    const status = isValid ? '✅' : '❌';
    console.log(`   ${status} ${variable.name}: ${isValid ? '✓ Configured' : '❌ Missing'}`);

    if (!isValid) {
      console.log(`      Description: ${variable.description}`);
      console.log(`      Example: ${variable.example}`);
      allValid = false;
    }
  });

  console.log('\n📊 CMS Variables:');
  sanityVars.forEach(variable => {
    const isValid = variable.value && variable.value.length > 0;
    const status = isValid ? '✅' : '○';
    console.log(`   ${status} ${variable.name}: ${isValid ? '✓ Configured' : '○ Optional'}`);
  });

  console.log('\n📋 Summary:');
  if (allValid) {
    console.log('🎉 All required environment variables are configured!');
    console.log('🚀 Ready to run integration tests');
    console.log('\nNext steps:');
    console.log('   1. npm run test:db-connection');
    console.log('   2. npm run test:integration');
    console.log('   3. npm run dev (start development server)');
  } else {
    console.log('⚠️  Some required environment variables are missing');
    console.log('📖 Please see MONGODB_SETUP.md for configuration instructions');
    console.log('\nQuick setup:');
    console.log('   1. Copy .env.example to .env.local');
    console.log('   2. Configure MONGODB_URI with your database');
    console.log('   3. Run this script again to validate');
  }

  return allValid;
}

// Run validation
const isValid = validateEnvironment();
process.exit(isValid ? 0 : 1);
