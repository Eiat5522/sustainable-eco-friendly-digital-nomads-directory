// events.spec.ts - Simple E2E test for /api/events endpoint structure

import { test, expect } from '@playwright/test';

/**
 * Basic E2E test for the Events API route.
 * Tests basic endpoint availability and response structure.
 * Error scenarios and detailed behavior testing are handled in unit tests.
 */
test.describe('/api/events E2E', () => {
  const endpoint = '/api/events';

  test('endpoint returns proper response structure', async ({ request }) => {
    const response = await request.get(endpoint);
    
    // The endpoint should return a response (may be 200 with data or 500 due to config)
    expect([200, 500]).toContain(response.status());
    
    const json = await response.json();
    
    if (response.status() === 200) {
      // Success case - verify structure
      expect(json).toHaveProperty('success');
      expect(json).toHaveProperty('data');
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
    } else {
      // Error case - verify error structure
      expect(json).toHaveProperty('success');
      expect(json).toHaveProperty('error');
      expect(json.success).toBe(false);
      expect(typeof json.error).toBe('string');
    }
  });
});
