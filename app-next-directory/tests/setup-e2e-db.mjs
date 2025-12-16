#!/usr/bin/env node

/**
 * E2E Test Setup Script
 *
 * This script prepares the isolated E2E test environment:
 * 1. Cleans up any existing test data
 * 2. Seeds the database with test fixtures
 * 3. Creates test user accounts
 *
 * Run before E2E tests to ensure a clean, consistent state.
 */

import bcrypt from 'bcryptjs';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/e2e_test';
const DB_NAME = 'e2e_test';

async function setupE2EDatabase() {
  let client;

  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();

    const db = client.db(DB_NAME);
    const collections = await db.listCollections().toArray();

    for (const collection of collections) {
      await db.collection(collection.name).drop();
    }

    // Users collection
    await db.createCollection('users');
    await db
      .collection('users')
      .createIndexes([{ key: { email: 1 }, unique: true, name: 'email_unique' }]);

    // Sessions collection
    await db.createCollection('sessions');
    await db.collection('sessions').createIndexes([
      { key: { sessionToken: 1 }, unique: true },
      { key: { expires: 1 }, expireAfterSeconds: 0 },
    ]);

    // Test listings collection (if needed)
    await db.createCollection('listings');

    // Create a test user
    const testUserEmail =
      process.env.TEST_USER_EMAIL ?? process.env.E2E_USER_EMAIL ?? 'e2e-test@example.com';
    const testUserPassword =
      process.env.TEST_USER_PASSWORD ?? process.env.E2E_USER_PASSWORD ?? 'password123';
    const adminEmail =
      process.env.TEST_ADMIN_EMAIL ?? process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com';
    const adminPassword =
      process.env.TEST_ADMIN_PASSWORD ?? process.env.E2E_ADMIN_PASSWORD ?? 'password123';
    const venueOwnerEmail =
      process.env.TEST_VENUE_OWNER_EMAIL ??
      process.env.E2E_VENUE_OWNER_EMAIL ??
      'venue@example.com';
    const venueOwnerPassword =
      process.env.TEST_VENUE_OWNER_PASSWORD ??
      process.env.E2E_VENUE_OWNER_PASSWORD ??
      'password123';

    const parsedCost = Number.parseInt(
      process.env.E2E_BCRYPT_COST ?? process.env.BCRYPT_COST ?? '10',
      10
    );
    const bcryptCost = Number.isFinite(parsedCost) && parsedCost > 3 ? parsedCost : 10;
    const now = new Date();

    const [testUserHash, adminHash, venueOwnerHash] = await Promise.all([
      bcrypt.hash(testUserPassword, bcryptCost),
      bcrypt.hash(adminPassword, bcryptCost),
      bcrypt.hash(venueOwnerPassword, bcryptCost),
    ]);

    const testUser = {
      email: testUserEmail,
      name: 'E2E Test User',
      password: testUserHash,
      role: 'user',
      status: 'active',
      emailVerified: now,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('users').insertOne(testUser);

    // Create an admin test user
    const adminUser = {
      email: adminEmail,
      name: 'E2E Admin User',
      password: adminHash,
      role: 'admin',
      status: 'active',
      emailVerified: now,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('users').insertOne(adminUser);

    // Create a venue owner test user
    const venueOwnerUser = {
      email: venueOwnerEmail,
      name: 'E2E Venue Owner',
      password: venueOwnerHash,
      role: 'venueOwner',
      status: 'active',
      emailVerified: now,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('users').insertOne(venueOwnerUser);
  } catch (_error) {
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Import structuredLogger for error logging
// Use dynamic import to handle ES module compatibility
async function getStructuredLogger() {
  try {
    const loggerModule = await import('../src/lib/logger.js');
    return loggerModule.structuredLogger;
  } catch (_error) {
    // Fallback to no-op for standalone usage (avoids console.error violation)
    return {
      error: () => {},
      info: () => {},
    };
  }
}

// Run setup
setupE2EDatabase()
  .then(async () => {
    const structuredLogger = await getStructuredLogger();
    structuredLogger.info('E2E database setup completed successfully');
  })
  .catch(async error => {
    const structuredLogger = await getStructuredLogger();
    structuredLogger.error('E2E database setup failed', error);
    process.exit(1);
  });
