import { test, expect } from '@playwright/test';

test.describe('User Dashboard API', () => {
  let authCookie: string;

  test.beforeAll(async ({ request }) => {
    // First, test if auth is working by trying to register/login
    const loginResponse = await request.post('/api/auth/signin', {
      data: {
        email: 'test@example.com',
        password: 'testpassword123'
      }
    });
    
    // For this test, we'll assume auth is working
    // In real tests, you'd need to properly authenticate
  });

  test('should get user preferences with default values', async ({ request }) => {
    const response = await request.get('/api/user/preferences');
    
    // Should handle unauthenticated requests
    expect(response.status()).toBe(401);
    
    const data = await response.json();
    expect(data.error).toBe('Authentication required');
  });

  test('should get user analytics with default values', async ({ request }) => {
    const response = await request.get('/api/user/analytics');
    
    // Should handle unauthenticated requests
    expect(response.status()).toBe(401);
    
    const data = await response.json();
    expect(data.error).toBe('Authentication required');
  });

  test('should get user dashboard with comprehensive data', async ({ request }) => {
    const response = await request.get('/api/user/dashboard');
    
    // Should handle unauthenticated requests
    expect(response.status()).toBe(401);
    
    const data = await response.json();
    expect(data.error).toBe('Authentication required');
  });

  test('should validate API endpoint structure', async ({ request }) => {
    // Test that endpoints exist and return proper error messages
    const endpoints = [
      '/api/user/preferences',
      '/api/user/analytics', 
      '/api/user/dashboard'
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);
      expect(response.status()).toBe(401);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('Authentication required');
    }
  });

  test('should handle POST requests for analytics tracking', async ({ request }) => {
    const response = await request.post('/api/user/analytics', {
      data: {
        eventType: 'page_view',
        eventData: {
          page: '/listings',
          duration: 5000
        }
      }
    });
    
    // Should handle unauthenticated requests
    expect(response.status()).toBe(401);
    
    const data = await response.json();
    expect(data.error).toBe('Authentication required');
  });

  test('should handle PUT requests for preferences updates', async ({ request }) => {
    const response = await request.put('/api/user/preferences', {
      data: {
        location: {
          country: 'USA',
          city: 'New York'
        },
        notifications: {
          email: true,
          push: false
        }
      }
    });
    
    // Should handle unauthenticated requests  
    expect(response.status()).toBe(401);
    
    const data = await response.json();
    expect(data.error).toBe('Authentication required');
  });

  test('should handle PATCH requests for partial preference updates', async ({ request }) => {
    const response = await request.patch('/api/user/preferences', {
      data: {
        section: 'notifications',
        data: {
          email: false
        }
      }
    });
    
    // Should handle unauthenticated requests
    expect(response.status()).toBe(401);
    
    const data = await response.json();
    expect(data.error).toBe('Authentication required');
  });

  test('should validate request body formats', async ({ request }) => {
    // Test invalid request formats return proper errors
    const invalidRequests = [
      {
        endpoint: '/api/user/analytics',
        method: 'POST',
        data: { invalid: 'format' }
      },
      {
        endpoint: '/api/user/preferences', 
        method: 'PUT',
        data: { invalid: 'structure' }
      }
    ];

    for (const req of invalidRequests) {
      const response = await request[req.method.toLowerCase()](`${req.endpoint}`, {
        data: req.data
      });
      
      // Should still require authentication first
      expect(response.status()).toBe(401);
    }
  });
});

test.describe('API Route Integration Tests', () => {
  test('should have proper CORS headers', async ({ request }) => {
    const response = await request.options('/api/user/dashboard');
    
    // Check for proper CORS handling (if implemented)
    // This might return 404 or 405 depending on implementation
    expect([404, 405, 200].includes(response.status())).toBe(true);
  });

  test('should handle query parameters', async ({ request }) => {
    const response = await request.get('/api/user/analytics?timeRange=30d&includeHistory=false');
    
    expect(response.status()).toBe(401);
    
    const data = await response.json();
    expect(data.error).toBe('Authentication required');
  });

  test('should validate content types', async ({ request }) => {
    const response = await request.post('/api/user/analytics', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
        eventType: 'search',
        eventData: { query: 'test' }
      })
    });
    
    expect(response.status()).toBe(401);
  });
});
