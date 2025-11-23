// events.spec.ts - Simple E2E test for /api/events endpoint structure

import { expect, test } from '@playwright/test';

/**
 * Basic E2E test for the Events API route.
 * Tests basic endpoint availability and response structure.
 * Error scenarios and detailed behavior testing are handled in unit tests.
 */
test.describe('/api/events E2E', () => {
  const endpoint = '/api/events';

  test('endpoint returns proper response structure', async ({ request }) => {
    const response = await request.get(endpoint);

    // The endpoint should return a successful response
    expect(response.status()).toBe(200);

    const json = await response.json();

    // Verify success structure
    expect(json).toHaveProperty('success');
    expect(json).toHaveProperty('data');
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });
});
