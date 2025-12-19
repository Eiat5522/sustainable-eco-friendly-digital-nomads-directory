#!/usr/bin/env node
/**
 * E2E Test Setup Script
 *
 * This script prepares the isolated E2E test environment:
 * 1. Cleans up any existing test data
 * 2. Seeds the database with test fixtures
 * 3. Creates test user accounts with valid bcrypt hashes
 *
 * Run before E2E tests to ensure a clean, consistent state.
 *
 * Test Credentials (see tmp/playwright-local.env):
 * - admin@example.com / TestSecurePass123! (admin role)
 * - e2e-test@example.com / TestSecurePass123! (user role)
 * - venue@example.com / TestSecurePass123! (venue_owner role)
 * - user@example.com / password123 (user role)
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/e2e_test';
const DB_NAME = 'e2e_test';

async function setupE2EDatabase() {
  console.log('🚀 Setting up E2E test database...');

  let client;

  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);

    // Drop existing collections to ensure clean state
    console.log('🧹 Cleaning up existing test data...');
    const collections = await db.listCollections().toArray();

    for (const collection of collections) {
      await db.collection(collection.name).drop();
      console.log(`  - Dropped collection: ${collection.name}`);
    }

    // Create test collections with indexes
    console.log('📦 Creating collections and indexes...');

    // Users collection
    await db.createCollection('users');
    await db
      .collection('users')
      .createIndexes([{ key: { email: 1 }, unique: true, name: 'email_unique' }]);
    console.log('  - Created users collection');

    // Sessions collection
    await db.createCollection('sessions');
    await db.collection('sessions').createIndexes([
      { key: { sessionToken: 1 }, unique: true },
      { key: { expires: 1 }, expireAfterSeconds: 0 },
    ]);
    console.log('  - Created sessions collection');

    // Test listings collection (if needed)
    await db.createCollection('listings');
    console.log('  - Created listings collection');

    // Seed test data
    console.log('🌱 Seeding test data...');

    // Password hashes (bcrypt cost=10):
    // TestSecurePass123! -> $2b$10$Iv8szMeMBMy9ccAn3w2fmeO4Er6mBngxBTWczfzCvHy79rHxXqtDO
    // password123 -> $2b$10$yLvheTCz2tSBjfGEE2wZueQdJqcGTlCxNZJuGZYng3AlalOF6myNO

    const testUsers = [
      {
        email: 'e2e-test@example.com',
        name: 'E2E Test User',
        password: '$2b$10$Iv8szMeMBMy9ccAn3w2fmeO4Er6mBngxBTWczfzCvHy79rHxXqtDO', // TestSecurePass123!
        role: 'user',
        status: 'active',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'admin@example.com',
        name: 'E2E Admin User',
        password: '$2b$10$Iv8szMeMBMy9ccAn3w2fmeO4Er6mBngxBTWczfzCvHy79rHxXqtDO', // TestSecurePass123!
        role: 'admin',
        status: 'active',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'venue@example.com',
        name: 'E2E Venue Owner',
        password: '$2b$10$Iv8szMeMBMy9ccAn3w2fmeO4Er6mBngxBTWczfzCvHy79rHxXqtDO', // TestSecurePass123!
        role: 'venue_owner',
        status: 'active',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'user@example.com',
        name: 'E2E Regular User',
        password: '$2b$10$yLvheTCz2tSBjfGEE2wZueQdJqcGTlCxNZJuGZYng3AlalOF6myNO', // password123
        role: 'user',
        status: 'active',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const user of testUsers) {
      await db.collection('users').insertOne(user);
      console.log(`  - Created ${user.role} user: ${user.email}`);
    }

    console.log('\n✨ E2E database setup complete!\n');
    console.log('Database:', DB_NAME);
    console.log('Test users created:');
    testUsers.forEach(u => {
      console.log(`  - ${u.email} (role: ${u.role})`);
    });
    console.log('');
  } catch (error) {
    console.error('❌ Error setting up E2E database:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('✅ Closed database connection');
    }
  }
}

// Run setup
setupE2EDatabase().catch(console.error);
