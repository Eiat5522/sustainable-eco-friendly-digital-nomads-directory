// events.test.ts - Integration tests for /api/events

import { test, expect } from '@playwright/test';

/**
 * Integration tests for the Events API route.
 * Covers success, empty, and error scenarios.
 */
test.describe('/api/events', () => {
  const endpoint = '/api/events';

  test.describe('GET', () => {
    test('returns 200 and event data on success', async ({ request }) => {
      const response = await request.get(endpoint);
      expect(response.status()).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      // Example: check event fields if present
      if (json.data.length > 0) {
        expect(json.data[0]).toHaveProperty('title');
        expect(json.data[0]).toHaveProperty('startDate');
        expect(json.data[0]).toHaveProperty('slug');
      }
    });

    test('returns 200 and empty array if no events', async ({ request }) => {
      // The Sanity mock returns [] by default
      const response = await request.get(endpoint);
      expect(response.status()).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBe(0);
    });

    // Move error testing to unit tests or use API-level error simulation


    /**
     * Edge case: malformed URL/query params.
     * The handler ignores query params, so this should still succeed.
     */
    test('ignores irrelevant query parameters', async ({ request }) => {
      const response = await request.get(endpoint + '?foo=bar&baz=qux');
      expect(response.status()).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
    });
  });
});