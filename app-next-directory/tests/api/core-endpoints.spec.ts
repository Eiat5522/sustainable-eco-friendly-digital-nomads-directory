// API Integration Tests - No Browser Dependencies
// Tests core API endpoints using HTTP requests directly

import { test, expect } from '@playwright/test';

// Test configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Test helper function for API requests - moved to global scope
async function makeApiRequest(endpoint: string, options: RequestInit & { headers?: Record<string, string> } = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  return {
    response,
    data: response.headers.get('content-type')?.includes('application/json')
      ? await response.json()
      : await response.text(),
    status: response.status,
    headers: response.headers
  };
}

/**
 * E.1.1 Core API Endpoints Testing
 * Testing all major API endpoints for basic functionality
 */
test.describe('API Integration Tests - Core Endpoints', () => {

  test('GET /api/listings - List all listings', async () => {
    const { response, data, status } = await makeApiRequest('/listings');

    expect(status).toBe(200);
    expect(data).toHaveProperty('listings');
    expect(Array.isArray(data.listings)).toBe(true);

    // Test pagination
    if (data.listings.length > 0) {
      expect(data).toHaveProperty('pagination');
      expect(data.pagination).toHaveProperty('total');
      expect(data.pagination).toHaveProperty('page');
      expect(data.pagination).toHaveProperty('limit');
    }
  });

  test('GET /api/search - Search functionality', async () => {
    const { response, data, status } = await makeApiRequest('/search?q=co-working');

    expect(status).toBe(200);
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
  });

  test('GET /api/search/suggestions - Search suggestions', async () => {
    const { response, data, status } = await makeApiRequest('/search/suggestions?q=bali');

    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  test('GET /api/cities - List cities', async () => {
    const { response, data, status } = await makeApiRequest('/cities');

    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  test('GET /api/reviews - List reviews', async () => {
    const { response, data, status } = await makeApiRequest('/reviews');

    expect(status).toBe(200);
    expect(data).toHaveProperty('reviews');
    expect(Array.isArray(data.reviews)).toBe(true);
  });

  test('GET /api/reviews/analytics - Review analytics', async () => {
    const { response, data, status } = await makeApiRequest('/reviews/analytics');

    expect(status).toBe(200);
    expect(data).toHaveProperty('totalReviews');
    expect(data).toHaveProperty('averageRating');
    expect(data).toHaveProperty('ratingDistribution');
  });

  test('GET /api/session - Session endpoint', async () => {
    const { response, data, status } = await makeApiRequest('/session');

    // Should return session data or null if not authenticated
    expect([200, 401]).toContain(status);
  });

  test('GET /api/performance/web-vitals - Web vitals endpoint', async () => {
    const { response, data, status } = await makeApiRequest('/performance/web-vitals');

    expect([200, 405]).toContain(status); // 405 if only POST is allowed
  });

});

/**
 * E.1.2 API Error Handling Testing
 * Testing error responses and edge cases
 */
test.describe('API Integration Tests - Error Handling', () => {

  test('GET /api/listings with invalid pagination', async () => {
    const { response, data, status } = await makeApiRequest('/listings?page=-1&limit=invalid');

    // Should handle invalid pagination gracefully
    expect([200, 400]).toContain(status);
  });

  test('GET /api/search with empty query', async () => {
    const { response, data, status } = await makeApiRequest('/search?q=');

    expect([200, 400]).toContain(status);
  });

  test('GET /api/nonexistent-endpoint', async () => {
    const { response, data, status } = await makeApiRequest('/nonexistent-endpoint');

    expect(status).toBe(404);
  });

  test('POST /api/reviews without authentication', async () => {
    const { response, data, status } = await makeApiRequest('/reviews', {
      method: 'POST',
      body: JSON.stringify({
        listingId: 'test-listing',
        rating: 5,
        comment: 'Test review'
      })
    });

    // Should require authentication
    expect([401, 403]).toContain(status);
  });

});

/**
 * E.1.3 API Response Format Testing
 * Testing response structure and data types
 */
test.describe('API Integration Tests - Response Formats', () => {

  test('API responses have consistent error format', async () => {
    const { response, data, status } = await makeApiRequest('/nonexistent-endpoint');

    expect(status).toBe(404);
    if (typeof data === 'object' && data !== null) {
      expect(data).toHaveProperty('error');
      expect(typeof data.error).toBe('string');
    }
  });

  test('API responses include proper CORS headers', async () => {
    const { response, headers } = await makeApiRequest('/listings');

    // Check for CORS headers (if configured)
    const corsHeader = headers.get('access-control-allow-origin');
    if (corsHeader) {
      expect(['*', 'http://localhost:3000']).toContain(corsHeader);
    }
  });

  test('API responses include proper content-type headers', async () => {
    const { response, headers } = await makeApiRequest('/listings');

    const contentType = headers.get('content-type');
    expect(contentType).toContain('application/json');
  });

});
