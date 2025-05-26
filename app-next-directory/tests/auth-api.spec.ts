import { expect, test } from '@playwright/test';

test.describe('Authentication API', () => {

  test.describe('POST /api/auth/register', () => {
    test('should register a new user successfully', async ({ request }) => {
      const response = await request.post('/api/auth/register', {
        data: {
          name: 'API Test User',
          email: `apitest+${Date.now()}@example.com`,
          password: 'password123'
        }
      });

      expect(response.status()).toBe(201);

      const responseBody = await response.json();
      expect(responseBody.message).toBe('User registered successfully');
      expect(responseBody.user).toBeDefined();
      expect(responseBody.user.email).toContain('apitest');
      expect(responseBody.user.role).toBe('user');
    });

    test('should return 400 for invalid data', async ({ request }) => {
      const response = await request.post('/api/auth/register', {
        data: {
          name: 'Test User'
          // Missing email and password
        }
      });

      expect(response.status()).toBe(400);

      const responseBody = await response.json();
      expect(responseBody.message).toBe('Invalid request body');
      expect(responseBody.errors).toBeDefined();
    });

    test('should return 409 for existing user', async ({ request }) => {
      const email = 'existing@example.com';

      // First registration
      await request.post('/api/auth/register', {
        data: {
          name: 'First User',
          email: email,
          password: 'password123'
        }
      });

      // Second registration with same email
      const response = await request.post('/api/auth/register', {
        data: {
          name: 'Second User',
          email: email,
          password: 'password123'
        }
      });

      expect(response.status()).toBe(409);

      const responseBody = await response.json();
      expect(responseBody.message).toBe('User already exists');
    });

    test('should validate email format', async ({ request }) => {
      const response = await request.post('/api/auth/register', {
        data: {
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123'
        }
      });

      expect(response.status()).toBe(400);

      const responseBody = await response.json();
      expect(responseBody.message).toBe('Invalid request body');
      expect(responseBody.errors).toContain('Invalid email format');
    });

    test('should validate password length', async ({ request }) => {
      const response = await request.post('/api/auth/register', {
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: '123' // Too short
        }
      });

      expect(response.status()).toBe(400);

      const responseBody = await response.json();
      expect(responseBody.message).toBe('Invalid request body');
      expect(responseBody.errors).toContain('Password must be at least 6 characters');
    });
  });

  test.describe('POST /api/auth/signin', () => {
    test.beforeEach(async ({ request }) => {
      // Create a test user for login tests
      await request.post('/api/auth/register', {
        data: {
          name: 'Login Test User',
          email: 'logintest@example.com',
          password: 'password123'
        }
      });
    });

    test('should login successfully with valid credentials', async ({ request }) => {
      const response = await request.post('/api/auth/signin', {
        data: {
          email: 'logintest@example.com',
          password: 'password123'
        }
      });

      expect(response.status()).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.user).toBeDefined();
      expect(responseBody.user.email).toBe('logintest@example.com');
      expect(responseBody.token).toBeDefined();
    });

    test('should return 401 for invalid credentials', async ({ request }) => {
      const response = await request.post('/api/auth/signin', {
        data: {
          email: 'logintest@example.com',
          password: 'wrongpassword'
        }
      });

      expect(response.status()).toBe(401);

      const responseBody = await response.json();
      expect(responseBody.message).toBe('Invalid credentials');
    });

    test('should return 404 for non-existent user', async ({ request }) => {
      const response = await request.post('/api/auth/signin', {
        data: {
          email: 'nonexistent@example.com',
          password: 'password123'
        }
      });

      expect(response.status()).toBe(404);

      const responseBody = await response.json();
      expect(responseBody.message).toBe('User not found');
    });

    test('should validate required fields', async ({ request }) => {
      const response = await request.post('/api/auth/signin', {
        data: {
          email: 'test@example.com'
          // Missing password
        }
      });

      expect(response.status()).toBe(400);

      const responseBody = await response.json();
      expect(responseBody.message).toBe('Invalid request body');
      expect(responseBody.errors).toContain('Password is required');
    });
  });

  test.describe('GET /api/auth/session', () => {
    test('should return session for authenticated user', async ({ request }) => {
      // First login to get session
      const loginResponse = await request.post('/api/auth/signin', {
        data: {
          email: 'logintest@example.com',
          password: 'password123'
        }
      });

      const { token } = await loginResponse.json();

      // Get session with token
      const sessionResponse = await request.get('/api/auth/session', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      expect(sessionResponse.status()).toBe(200);

      const sessionBody = await sessionResponse.json();
      expect(sessionBody.user).toBeDefined();
      expect(sessionBody.user.email).toBe('logintest@example.com');
    });

    test('should return 401 for unauthenticated request', async ({ request }) => {
      const response = await request.get('/api/auth/session');

      expect(response.status()).toBe(401);

      const responseBody = await response.json();
      expect(responseBody.message).toBe('Not authenticated');
    });

    test('should return 401 for invalid token', async ({ request }) => {
      const response = await request.get('/api/auth/session', {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });

      expect(response.status()).toBe(401);

      const responseBody = await response.json();
      expect(responseBody.message).toBe('Invalid token');
    });
  });

  test.describe('POST /api/auth/signout', () => {
    test('should sign out successfully', async ({ request }) => {
      // First login
      const loginResponse = await request.post('/api/auth/signin', {
        data: {
          email: 'logintest@example.com',
          password: 'password123'
        }
      });

      const { token } = await loginResponse.json();

      // Sign out
      const signoutResponse = await request.post('/api/auth/signout', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      expect(signoutResponse.status()).toBe(200);

      const signoutBody = await signoutResponse.json();
      expect(signoutBody.message).toBe('Signed out successfully');

      // Verify session is invalidated
      const sessionResponse = await request.get('/api/auth/session', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      expect(sessionResponse.status()).toBe(401);
    });
  });

  test.describe('Rate Limiting', () => {
    test('should rate limit registration attempts', async ({ request }) => {
      const promises = [];

      // Make multiple rapid requests
      for (let i = 0; i < 10; i++) {
        promises.push(
          request.post('/api/auth/register', {
            data: {
              name: `Test User ${i}`,
              email: `ratetest${i}@example.com`,
              password: 'password123'
            }
          })
        );
      }

      const responses = await Promise.all(promises);

      // At least one should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status() === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('should rate limit login attempts', async ({ request }) => {
      const promises = [];

      // Make multiple rapid login attempts
      for (let i = 0; i < 10; i++) {
        promises.push(
          request.post('/api/auth/signin', {
            data: {
              email: 'logintest@example.com',
              password: 'wrongpassword'
            }
          })
        );
      }

      const responses = await Promise.all(promises);

      // Should be rate limited after too many failed attempts
      const rateLimitedResponses = responses.filter(r => r.status() === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
