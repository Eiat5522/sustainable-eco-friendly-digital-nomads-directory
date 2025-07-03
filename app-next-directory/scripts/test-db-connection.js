#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests MongoDB connection and authentication setup
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.test' });

async function testDatabaseConnection() {
  console.log('🔧 Testing Database Connection...\n');

  // Check environment variables
  const mongoUri = process.env.MONGODB_URI;
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  const nextAuthUrl = process.env.NEXTAUTH_URL;

  console.log('📋 Environment Check:');
  console.log(`✅ MONGODB_URI: ${mongoUri ? '✓ Configured' : '❌ Missing'}`);
  console.log(`✅ NEXTAUTH_SECRET: ${nextAuthSecret ? '✓ Configured' : '❌ Missing'}`);
  console.log(`✅ NEXTAUTH_URL: ${nextAuthUrl ? '✓ Configured' : '❌ Missing'}\n`);

  if (!mongoUri) {
    console.log('❌ Error: MONGODB_URI not configured');
    console.log('📖 Please see MONGODB_SETUP.md for setup instructions');
    process.exit(1);
  }

  // Test MongoDB connection
  let client;
  try {
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(mongoUri);
    await client.connect();

    const db = client.db();
    await db.admin().ping();

    console.log('✅ MongoDB connection successful!');
    console.log(`📊 Database: ${db.databaseName}`);

    // Test basic operations
    const collections = await db.listCollections().toArray();
    console.log(`📁 Collections: ${collections.length} found`);

    // Test authentication collections
    const authCollections = ['users', 'accounts', 'sessions'];
    console.log('\n📋 Authentication Collections:');

    for (const collName of authCollections) {
      const exists = collections.some(c => c.name === collName);
      console.log(`   ${collName}: ${exists ? '✓ Exists' : '○ Will be created on first use'}`);
    }

    console.log('\n🎉 Database setup is ready for authentication!');

  } catch (error) {
    console.log('❌ MongoDB connection failed:');
    console.log(`   Error: ${error.message}`);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check your MONGODB_URI in .env.local');
    console.log('   2. Verify network access in MongoDB Atlas');
    console.log('   3. Confirm username/password are correct');
    console.log('   4. See MONGODB_SETUP.md for detailed instructions');
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the test
testDatabaseConnection().catch(console.error);
