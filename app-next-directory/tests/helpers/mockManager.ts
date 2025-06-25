// Centralized mock setup/reset for tests (Response, NextResponse, Sanity, Mongoose, etc.)

import { jest } from '@jest/globals';

type MockResetFn = () => void;

const registeredResets: MockResetFn[] = [];

/**
 * Register a reset function to be called after each test.
 */
export function registerMockReset(fn: MockResetFn) {
  registeredResets.push(fn);
}

/**
 * Reset all registered mocks.
 */
export function resetAllMocks() {
  registeredResets.forEach((fn) => fn());
  jest.clearAllMocks();
}

/**
 * Example: Registering a mock for Mongoose
 */
// import mongoose from 'mongoose';
// registerMockReset(() => mongoose.connection?.close());

/**
 * Example: Registering a mock for Sanity client
 */
// import { sanityClient } from '../../src/lib/sanity';
// registerMockReset(() => sanityClient.resetMocks?.());

/**
 * Call in test setup:
 * afterEach(resetAllMocks);
 */