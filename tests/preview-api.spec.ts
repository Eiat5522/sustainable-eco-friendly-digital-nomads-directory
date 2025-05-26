import { test, expect } from '@playwright/test';

// Preview API Test Suite
test.describe('Preview API Routes', () => {
  // Mock environment setup
  const mockEnv = {
    NODE_ENV: process.env.NODE_ENV || 'test',
    PREVIEW_SECRET: process.env.PREVIEW_SECRET || ''
  };

  test('preview route should set preview mode cookie', async ({ request }) => {
    const response = await request.get('/api/preview?redirect=/');
    expect(response.ok()).toBeTruthy();

    const headers = response.headers();
    expect(headers['set-cookie']).toBeTruthy();
    expect(headers['set-cookie']).toContain('__previewMode');
  });

  test('preview route should require secret in production', async ({ request }) => {
    // Store original environment values
    const originalNodeEnv = mockEnv.NODE_ENV;

    try {
      // Set mock environment to production
      mockEnv.NODE_ENV = 'production';

      // Mock the environment check in the API route
      await request.get('/api/mock-env', {
        headers: { 'x-test-node-env': mockEnv.NODE_ENV }
      });

      const response = await request.get('/api/preview');
      expect(response.status()).toBe(401);
    } finally {
      // Restore original environment values
      mockEnv.NODE_ENV = originalNodeEnv;
    }
  });

  test('exit-preview route should clear preview mode', async ({ request }) => {
    // First enable preview mode
    await request.get('/api/preview?redirect=/');

    // Then exit preview mode
    const response = await request.get('/api/exit-preview');
    expect(response.ok()).toBeTruthy();

    const headers = response.headers();
    expect(headers['set-cookie']).toBeTruthy();
    expect(headers['set-cookie']).toContain('__previewMode=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  });

  test('preview route should handle missing redirect parameter', async ({ request }) => {
    const response = await request.get('/api/preview');
    expect(response.ok()).toBeTruthy();

    // Should default to home page
    const headers = response.headers();
    expect(headers['location']).toBe('/');
  });

  test('preview route should respect custom redirect', async ({ request }) => {
    const customRedirect = '/listings/test-listing';
    const response = await request.get(`/api/preview?redirect=${encodeURIComponent(customRedirect)}`);
    expect(response.ok()).toBeTruthy();

    const headers = response.headers();
    expect(headers['location']).toBe(customRedirect);
  });

  test('preview route should sanitize redirect parameter', async ({ request }) => {
    // Attempt to redirect to external URL
    const maliciousRedirect = 'https://malicious-site.com';
    const response = await request.get(`/api/preview?redirect=${encodeURIComponent(maliciousRedirect)}`);
    expect(response.ok()).toBeTruthy();

    // Should default to home page for security
    const headers = response.headers();
    expect(headers['location']).toBe('/');
  });

  test('exit-preview route should redirect to last page', async ({ request }) => {
    const lastPage = '/listings';
    const response = await request.get(`/api/exit-preview?redirect=${encodeURIComponent(lastPage)}`);
    expect(response.ok()).toBeTruthy();

    const headers = response.headers();
    expect(headers['location']).toBe(lastPage);
  });

  test('preview route should handle concurrent requests', async ({ request }) => {
    // Send multiple preview requests simultaneously
    const requests = Array(5).fill(null).map(() =>
      request.get('/api/preview?redirect=/')
    );

    const responses = await Promise.all(requests);

    // All requests should succeed
    responses.forEach(response => {
      expect(response.ok()).toBeTruthy();
      expect(response.headers()['set-cookie']).toBeTruthy();
    });
  });

  test('preview mode should respect production secret when set', async ({ request }) => {
    // Store original environment values
    const originalNodeEnv = mockEnv.NODE_ENV;
    const originalPreviewSecret = mockEnv.PREVIEW_SECRET;

    try {
      // Set mock environment values
      mockEnv.NODE_ENV = 'production';
      mockEnv.PREVIEW_SECRET = 'test-secret';

      // Mock the environment check in the API route
      await request.get('/api/mock-env', {
        headers: {
          'x-test-node-env': mockEnv.NODE_ENV,
          'x-test-preview-secret': mockEnv.PREVIEW_SECRET
        }
      });

      // Request without secret should fail
      let response = await request.get('/api/preview');
      expect(response.status()).toBe(401);

      // Request with incorrect secret should fail
      response = await request.get('/api/preview?secret=wrong-secret');
      expect(response.status()).toBe(401);

      // Request with correct secret should succeed
      response = await request.get('/api/preview?secret=test-secret');
      expect(response.ok()).toBeTruthy();
    } finally {
      // Restore original environment values
      mockEnv.NODE_ENV = originalNodeEnv;
      mockEnv.PREVIEW_SECRET = originalPreviewSecret;
    }
  });
});
