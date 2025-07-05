jest.mock('next-sanity', () => ({
  createClient: jest.fn(() => ({
    fetch: jest.fn(() => Promise.resolve([])),
    create: jest.fn(() => Promise.resolve({ _id: 'mock-id' })),
    update: jest.fn(() => Promise.resolve({})),
    delete: jest.fn(() => Promise.resolve('')),
    // Add a comprehensive mock for the patch method
    patch: jest.fn(() => ({
      set: jest.fn(() => ({
        unset: jest.fn(() => ({
          commit: jest.fn(() => Promise.resolve({})),
        })),
        commit: jest.fn(() => Promise.resolve({})),
      })),
      insert: jest.fn(() => ({
        after: jest.fn(() => ({
          commit: jest.fn(() => Promise.resolve({})),
        })),
      })),
      diffMatchPatch: jest.fn(() => ({
        commit: jest.fn(() => Promise.resolve({})),
      })),
      commit: jest.fn(() => Promise.resolve({})),
    })),
  })),
  imageUrlBuilder: jest.fn(() => ({
    image: jest.fn(() => ({
      url: jest.fn(() => 'mock-image-url'),
    })),
  })),
}));
/**
 * Sanity HTTP Client Test Suite
 * Day 1 Sprint: API Authentication Testing
 * Date: May 24, 2025
 */

import { SanityAPIError, sanityHTTPClient } from '../lib/sanity-http-client'

describe('Sanity HTTP Client Test Suite', () => {
  // Test suite for the HTTP client
  class SanityClientTester {

    async testHealthCheck(): Promise<void> {
      const health = await sanityHTTPClient.healthCheck();
      if (health.status !== 'ok') {
        throw new Error('Health check failed');
      }
    }

    async testAuthentication(): Promise<void> {
      if (!process.env.SANITY_API_TOKEN) {
        // console.log('⚠️ No API token - skipping auth test');
        return;
      }
      const isAuthenticated = await sanityHTTPClient.testAuthentication();
      if (!isAuthenticated) {
        throw new Error('Authentication test failed');
      }
    }

    async testReadOperations(): Promise<void> {
      await sanityHTTPClient.query('*[_type == "listing"][0..2]');
      const cityQuery = `*[_type == "city" && defined(name)][0..1]{ _id, name, country }`;
      await sanityHTTPClient.query(cityQuery);
    }

    async testWriteOperations(): Promise<void> {
      const testDoc = {
        _type: 'testDocument',
        title: 'API Test Document',
        description: 'Created by HTTP client test suite',
        createdAt: new Date().toISOString(),
        testData: {
          environment: process.env.NODE_ENV,
          timestamp: Date.now()
        }
      };
      const created = await sanityHTTPClient.create(testDoc);
      await sanityHTTPClient.update(created._id, {
        title: 'Updated API Test Document',
        updatedAt: new Date().toISOString()
      });
      await sanityHTTPClient.delete(created._id);
    }

    async testErrorHandling(): Promise<void> {
      try {
        await sanityHTTPClient.query('INVALID GROQ QUERY');
      } catch (error) {
        if (!(error instanceof SanityAPIError)) {
          throw new Error('Expected SanityAPIError but got different error type');
        }
      }
    }
  }

  const tester = new SanityClientTester();

  it('1. should pass health check', async () => {
    await tester.testHealthCheck();
  });

  it('2. should pass authentication test', async () => {
    await tester.testAuthentication();
  });

  it('3. should perform read operations successfully', async () => {
    await tester.testReadOperations();
  });

  it('4. should perform write operations successfully (if API token provided)', async () => {
    if (process.env.SANITY_API_TOKEN) {
      await tester.testWriteOperations();
    } else {
      // Skipping write tests - no API token provided
      return;
    }
  });

  it('5. should handle errors correctly', async () => {
    await tester.testErrorHandling();
  });
});
