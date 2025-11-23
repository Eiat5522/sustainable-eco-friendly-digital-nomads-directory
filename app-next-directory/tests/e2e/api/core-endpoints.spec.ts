// API Integration Tests - No Browser Dependencies
// Tests core API endpoints using HTTP requests directly

import { expect, test as playwrightTest } from '@playwright/test';

// Test configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Test helper function for API requests - moved to global scope
async function makeApiRequest(
  endpoint: string,
  options: RequestInit & { headers?: Record<string, string> } = {}
) {
  try {
    const headers: Record<string, string> = { ...(options.headers ?? {}) };
    if (options.method && ['POST', 'PUT', 'PATCH'].includes(options.method.toUpperCase())) {
      const hasContentType = Object.keys(headers).some(key => key.toLowerCase() === 'content-type');
      if (!hasContentType) {
        headers['Content-Type'] = 'application/json';
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    let data;
    try {
      data = response.headers.get('content-type')?.includes('application/json')
        ? await response.json()
        : await response.text();
    } catch {
      data = null;
    }

    return {
      response,
      data,
      status: response.status,
      headers: response.headers,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (error instanceof Error) {
      error.message = `API request failed: ${error.message}`;
      throw error;
    }
    throw new Error(`API request failed: ${message}`);
  }
}

/**
 * E.1.1 Core API Endpoints Testing
 * Testing all major API endpoints for basic functionality
 */
playwrightTest.describe('API Integration Tests - Core Endpoints', () => {
  playwrightTest('GET /api/listings - List all listings', async () => {
    const { data, status } = await makeApiRequest('/listings');

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

  playwrightTest('GET /api/search - Search functionality', async () => {
    const { data, status } = await makeApiRequest('/search?q=co-working');

    expect(status).toBe(200);
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
  });

  playwrightTest('GET /api/search/suggestions - Search suggestions', async () => {
    const { data, status } = await makeApiRequest('/search/suggestions?q=bali');

    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  playwrightTest('GET /api/cities - List cities', async () => {
    const { data, status } = await makeApiRequest('/cities');

    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  playwrightTest('GET /api/reviews - List reviews', async () => {
    const { data, status } = await makeApiRequest('/reviews');

    expect(status).toBe(200);
    expect(data).toHaveProperty('reviews');
    expect(Array.isArray(data.reviews)).toBe(true);
  });

  playwrightTest('GET /api/reviews/analytics - Review analytics', async () => {
    const { data, status } = await makeApiRequest('/reviews/analytics');

    expect(status).toBe(200);
    expect(data).toHaveProperty('totalReviews');
  });

  playwrightTest('GET /api/session - Session endpoint', async () => {
    const { data, status } = await makeApiRequest('/session');

    if (status === 200) {
      expect(data).toHaveProperty('user');
    } else if (status === 401) {
      expect(data).toHaveProperty('error');
    } else {
      throw new Error(`Unexpected status code: ${status}`);
    }
  });

  playwrightTest('GET /api/performance/web-vitals - Web vitals endpoint', async () => {
    const { status } = await makeApiRequest('/performance/web-vitals');

    expect([200, 405]).toContain(status); // 405 if only POST is allowed
  });
});

/**
 * E.1.2 API Error Handling Testing
 * Testing error responses and edge cases
 */
playwrightTest.describe('API Integration Tests - Error Handling', () => {
  playwrightTest('GET /api/listings with invalid pagination', async () => {
    const { status } = await makeApiRequest('/listings?page=-1&limit=invalid');

    // Should handle invalid pagination gracefully
    expect([200, 400]).toContain(status);
  });

  playwrightTest('GET /api/search with empty query', async () => {
    const { status } = await makeApiRequest('/search?q=');

    expect([200, 400]).toContain(status);
  });

  playwrightTest('GET /api/nonexistent-endpoint', async () => {
    const { status } = await makeApiRequest('/nonexistent-endpoint');

    expect(status).toBe(404);
  });

  playwrightTest('POST /api/reviews without authentication', async () => {
    const { data, status } = await makeApiRequest('/reviews', {
      method: 'POST',
      body: JSON.stringify({
        listingId: 'test-listing',
        rating: 5,
        comment: 'Test review',
      }),
    });

    expect([401, 403]).toContain(status);
    if (typeof data === 'object' && data !== null) {
      expect(data).toHaveProperty('error');
      expect(typeof data.error).toBe('string');
    }
  });
});

/**
 * E.1.3 API Response Format Testing
 * Testing response structure and data types
 */
playwrightTest.describe('API Integration Tests - Response Formats', () => {
  playwrightTest('API responses have consistent error format', async () => {
    const { data, status } = await makeApiRequest('/nonexistent-endpoint');

    expect(status).toBe(404);
    if (typeof data === 'object' && data !== null) {
      expect(data).toHaveProperty('error');
      expect(typeof data.error).toBe('string');
    }
  });

  playwrightTest('API responses include proper CORS headers', async () => {
    const { headers } = await makeApiRequest('/listings');

    // Check for CORS headers (if configured)
    const corsHeader = headers.get('access-control-allow-origin');
    if (corsHeader) {
      expect(['*', 'http://localhost:3000']).toContain(corsHeader);
    }
  });

  playwrightTest('API responses include proper content-type headers', async () => {
    const { headers } = await makeApiRequest('/listings');

    const contentType = headers.get('content-type');
    expect(contentType).toContain('application/json');
  });
});
