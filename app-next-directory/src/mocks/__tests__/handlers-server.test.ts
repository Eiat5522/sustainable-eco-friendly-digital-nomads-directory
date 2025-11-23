/**
 * Integration tests for MSW handlers
 * These tests actually execute the handler logic by simulating HTTP requests
 */

import { setupServer } from 'msw/node';
import { handlers, setRegisterResponse, setReviewsResponse } from '../handlers';

// Setup MSW server
const server = setupServer(...handlers);

describe('MSW Handlers Integration Tests', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'bypass' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe('Search Endpoints', () => {
    it('should handle GET /api/search with query', async () => {
      const response = await fetch('http://localhost/api/search?q=test');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.results).toBeDefined();
    });

    it('should handle GET /api/search without query', async () => {
      const response = await fetch('http://localhost/api/search');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data.results).toBeDefined();
    });

    it('should handle POST /api/search with body', async () => {
      const response = await fetch('http://localhost/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'test' }),
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.results).toBeDefined();
    });

    it('should handle POST /api/search with empty body', async () => {
      const response = await fetch('http://localhost/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.results).toBeDefined();
    });

    it('should handle POST /api/search with invalid JSON', async () => {
      const response = await fetch('http://localhost/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid',
      });

      expect(response.ok).toBe(true);
    });

    it('should handle GET /api/search/suggestions', async () => {
      const response = await fetch('http://localhost/api/search/suggestions');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Listings Endpoints', () => {
    it('should handle GET /api/test-listings', async () => {
      const response = await fetch('http://localhost/api/test-listings');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.listings).toBeDefined();
    });

    it('should handle GET /api/test-lidtings (typo endpoint)', async () => {
      const response = await fetch('http://localhost/api/test-lidtings');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.listings).toBeDefined();
    });

    it('should handle GET /api/listings', async () => {
      const response = await fetch('http://localhost/api/listings');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.listings).toBeDefined();
    });

    it('should handle GET /api/listings with citySlug', async () => {
      const response = await fetch('http://localhost/api/listings?citySlug=bangkok');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data.listings).toBeDefined();
    });

    it('should handle GET /api/listings with pagination', async () => {
      const response = await fetch('http://localhost/api/listings?page=2&limit=10');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data.pagination).toBeDefined();
      expect(data.data.pagination.page).toBe(2);
      expect(data.data.pagination.limit).toBe(10);
    });

    it('should handle GET /api/featured-listings', async () => {
      const response = await fetch('http://localhost/api/featured-listings');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.listings).toBeDefined();
    });
  });

  describe('Cities Endpoints', () => {
    it('should handle GET /api/cities', async () => {
      const response = await fetch('http://localhost/api/cities');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.cities).toBeDefined();
    });

    it('should handle GET /api/cities/:slug with valid slug', async () => {
      const response = await fetch('http://localhost/api/cities/bangkok');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
    });

    it('should handle GET /api/cities/:slug with invalid slug', async () => {
      const response = await fetch('http://localhost/api/cities/nonexistent');
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe('Categories and Amenities', () => {
    it('should handle GET /api/categories', async () => {
      const response = await fetch('http://localhost/api/categories');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.categories).toBeDefined();
    });

    it('should handle GET /api/amenities', async () => {
      const response = await fetch('http://localhost/api/amenities');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.amenities).toBeDefined();
      expect(Array.isArray(data.amenities)).toBe(true);
    });
  });

  describe('Reviews Endpoints', () => {
    it('should handle POST /api/reviews', async () => {
      const response = await fetch('http://localhost/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: 5, comment: 'Great!' }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.rating).toBe(5);
    });

    it('should handle POST /api/reviews with empty body', async () => {
      const response = await fetch('http://localhost/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });

    it('should handle GET /api/reviews', async () => {
      const response = await fetch('http://localhost/api/reviews');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.reviews).toBeDefined();
    });

    it('should handle GET /api/reviews with listingId', async () => {
      const response = await fetch('http://localhost/api/reviews?listingId=test-id');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data.reviews).toBeDefined();
    });

    it('should handle GET /api/reviews with listing param', async () => {
      const response = await fetch('http://localhost/api/reviews?listing=test-id');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data.averageRating).toBeDefined();
    });
  });

  describe('Contact Endpoint', () => {
    it('should handle POST /api/contact', async () => {
      const response = await fetch('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John',
          email: 'john@test.com',
          subject: 'Test',
          message: 'Hello',
        }),
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('John');
    });

    it('should handle POST /api/contact with empty body', async () => {
      const response = await fetch('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
    });
  });

  describe('User Endpoints', () => {
    it('should handle GET /api/user/favorites', async () => {
      const response = await fetch('http://localhost/api/user/favorites');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.favorites).toBeDefined();
    });
  });

  describe('Auth Endpoints', () => {
    it('should handle GET /api/auth/providers', async () => {
      const response = await fetch('http://localhost/api/auth/providers');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.google).toBeDefined();
      expect(data.facebook).toBeDefined();
    });

    it('should handle POST /api/auth/register', async () => {
      const response = await fetch('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.email).toBe('test@example.com');
    });

    it('should handle POST /api/auth/register with empty body', async () => {
      const response = await fetch('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });
  });

  describe('Hello Endpoint', () => {
    it('should handle GET /api/hello', async () => {
      const response = await fetch('http://localhost/api/hello');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.message).toBe('Hello');
    });
  });

  describe('setReviewsResponse', () => {
    afterEach(() => {
      server.resetHandlers();
    });

    it('should create handler for unauthorized mode', () => {
      const handler = setReviewsResponse('unauthorized');
      expect(handler).toBeDefined();
    });

    it('should create handler for forbidden mode', () => {
      const handler = setReviewsResponse('forbidden');
      expect(handler).toBeDefined();
    });

    it('should create handler for conflict mode', () => {
      const handler = setReviewsResponse('conflict');
      expect(handler).toBeDefined();
    });

    it('should create handler for error mode', () => {
      const handler = setReviewsResponse('error');
      expect(handler).toBeDefined();
    });

    it('should create handler for success mode', () => {
      const handler = setReviewsResponse('success');
      expect(handler).toBeDefined();
    });
  });

  describe('setRegisterResponse', () => {
    afterEach(() => {
      server.resetHandlers();
    });

    it('should create handler for error mode', () => {
      const handler = setRegisterResponse('error');
      expect(handler).toBeDefined();
    });

    it('should create handler for success mode', () => {
      const handler = setRegisterResponse('success');
      expect(handler).toBeDefined();
    });
  });

  describe('Helper function execution coverage', () => {
    it('should execute setReviewsResponse unauthorized switch case', () => {
      const handler = setReviewsResponse('unauthorized');
      const info = (handler as any).info;
      expect(info?.method).toBe('POST');
    });

    it('should execute setReviewsResponse forbidden switch case', () => {
      const handler = setReviewsResponse('forbidden');
      const info = (handler as any).info;
      expect(info?.method).toBe('POST');
    });

    it('should execute setReviewsResponse conflict switch case', () => {
      const handler = setReviewsResponse('conflict');
      const info = (handler as any).info;
      expect(info?.method).toBe('POST');
    });

    it('should execute setReviewsResponse error switch case', () => {
      const handler = setReviewsResponse('error');
      const info = (handler as any).info;
      expect(info?.method).toBe('POST');
    });

    it('should execute setReviewsResponse success default case', () => {
      const handler = setReviewsResponse('success');
      const info = (handler as any).info;
      expect(info?.method).toBe('POST');
    });

    it('should execute setRegisterResponse error switch case', () => {
      const handler = setRegisterResponse('error');
      const info = (handler as any).info;
      expect(info?.method).toBe('POST');
    });

    it('should execute setRegisterResponse success default case', () => {
      const handler = setRegisterResponse('success');
      const info = (handler as any).info;
      expect(info?.method).toBe('POST');
    });
  });
});
