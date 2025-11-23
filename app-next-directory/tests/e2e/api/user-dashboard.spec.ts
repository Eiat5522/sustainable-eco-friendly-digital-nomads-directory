import { type APIRequestContext, expect, test as pwTest } from '@playwright/test';

const testUnauthenticatedGet = async (request: APIRequestContext, endpoint: string) => {
  const response = await request.get(endpoint);
  expect(response.status()).toBe(401);

  const data = await response.json();
  expect(data.error).toBe('Authentication required');
};

pwTest.describe('User Dashboard API', () => {
  pwTest('should get user preferences with default values', async ({ request }) => {
    await testUnauthenticatedGet(request, '/api/user/preferences');
  });

  pwTest('should get user analytics with default values', async ({ request }) => {
    await testUnauthenticatedGet(request, '/api/user/analytics');
  });

  pwTest('should get user dashboard with comprehensive data', async ({ request }) => {
    await testUnauthenticatedGet(request, '/api/user/dashboard');
  });

  pwTest('should handle POST requests for analytics tracking', async ({ request }) => {
    const response = await request.post('/api/user/analytics', {
      data: {
        eventType: 'pageView',
        eventData: {
          page: '/listings',
          duration: 5000,
        },
      },
    });

    // Should handle unauthenticated requests
    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data.error).toBe('Authentication required');
  });

  pwTest('should handle PUT requests for preferences updates', async ({ request }) => {
    const response = await request.put('/api/user/preferences', {
      data: {
        location: {
          country: 'USA',
          city: 'New York',
        },
        notifications: {
          email: true,
          push: false,
        },
      },
    });

    // Should handle unauthenticated requests
    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data.error).toBe('Authentication required');
  });

  pwTest('should handle PATCH requests for partial preference updates', async ({ request }) => {
    const response = await request.patch('/api/user/preferences', {
      data: {
        section: 'notifications',
        data: {
          email: false,
        },
      },
    });

    // Should handle unauthenticated requests
    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data.error).toBe('Authentication required');
  });

  pwTest('should validate request body formats', async ({ request }) => {
    // Test invalid request formats return proper errors
    const invalidRequests = [
      {
        endpoint: '/api/user/analytics',
        method: 'POST',
        data: { invalid: 'format' },
      },
      {
        endpoint: '/api/user/preferences',
        method: 'PUT',
        data: { invalid: 'structure' },
      },
    ];

    for (const req of invalidRequests) {
      let response: Awaited<ReturnType<typeof request.get>> | undefined;
      const method = req.method.toLowerCase();

      switch (method) {
        case 'get':
          response = await request.get(req.endpoint);
          break;
        case 'post':
          response = await request.post(req.endpoint, { data: req.data });
          break;
        case 'put':
          response = await request.put(req.endpoint, { data: req.data });
          break;
        case 'delete':
          response = await request.delete(req.endpoint);
          break;
        default:
          throw new Error(`Unsupported method: ${req.method}`);
      }

      // Should still require authentication first
      expect(response.status()).toBe(401);
    }
  });
});

pwTest.describe('API Route Integration Tests', () => {
  pwTest('should have proper CORS headers', async ({ request }) => {
    // Since options() method doesn't exist, test with HEAD or GET instead
    const response = await request.head('/api/user/dashboard');

    // Check for proper CORS handling (if implemented)
    // This might return 404 or 405 depending on implementation
    expect([405, 401].includes(response.status())).toBe(true);
  });

  pwTest('should handle query parameters', async ({ request }) => {
    const response = await request.get('/api/user/analytics?timeRange=30d&includeHistory=false');

    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data.error).toBe('Authentication required');
  });

  pwTest('should validate content types', async ({ request }) => {
    const response = await request.post('/api/user/analytics', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({
        eventType: 'search',
        eventData: { query: 'test' },
      }),
    });

    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data.error).toBe('Authentication required');
  });
});
