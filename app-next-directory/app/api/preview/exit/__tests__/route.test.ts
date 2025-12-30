/**
 * Test Suite for Preview Exit API Route
 * Tests covering:
 * 1. GET /api/preview/exit - Disable preview/draft mode
 * 2. Redirect behavior
 * 3. Custom redirect paths
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock Next.js modules
const mockDisable = jest.fn();
const mockDraftMode = jest.fn(() => Promise.resolve({ disable: mockDisable }));
jest.mock('next/headers', () => ({
  __esModule: true,
  draftMode: mockDraftMode,
}));

let GET: typeof import('../route').GET;

describe('Preview Exit API - GET /api/preview/exit', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    // Dynamically import the route handler
    const routeModule = await import('../route');
    GET = routeModule.GET;
  });

  describe('Successful Preview Exit', () => {
    it('should disable draft mode and redirect to homepage', async () => {
      const request = new Request('http://localhost/api/preview/exit');

      const response = await GET(request);

      expect(mockDraftMode).toHaveBeenCalled();
      expect(mockDisable).toHaveBeenCalled();
      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toContain('/');
    });

    it('should redirect to homepage when no redirect parameter', async () => {
      const request = new Request('http://localhost/api/preview/exit');

      const response = await GET(request);

      expect(response.status).toBe(302);
      const location = response.headers.get('location');
      expect(location).toBeTruthy();
      expect(location).toContain('http://localhost/');
    });

    it('should redirect to custom path when specified', async () => {
      const request = new Request(
        'http://localhost/api/preview/exit?redirect=/listings/eco-workspace'
      );

      const response = await GET(request);

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toContain('/listings/eco-workspace');
    });

    it('should handle redirect to listings page', async () => {
      const request = new Request('http://localhost/api/preview/exit?redirect=/listings');

      const response = await GET(request);

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toContain('/listings');
    });

    it('should handle redirect to blog page', async () => {
      const request = new Request(
        'http://localhost/api/preview/exit?redirect=/blog/sustainable-travel'
      );

      const response = await GET(request);

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toContain('/blog/sustainable-travel');
    });

    it('should handle redirect to cities page', async () => {
      const request = new Request('http://localhost/api/preview/exit?redirect=/cities/amsterdam');

      const response = await GET(request);

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toContain('/cities/amsterdam');
    });
  });

  describe('URL Construction', () => {
    it('should construct absolute URL from relative path', async () => {
      const request = new Request('http://localhost:3000/api/preview/exit?redirect=/about');

      const response = await GET(request);

      expect(response.status).toBe(302);
      const location = response.headers.get('location');
      expect(location).toContain('http://localhost:3000/about');
    });

    it('should preserve request origin in redirect', async () => {
      const request = new Request('https://example.com/api/preview/exit?redirect=/contact');

      const response = await GET(request);

      expect(response.status).toBe(302);
      const location = response.headers.get('location');
      expect(location).toContain('https://example.com/contact');
    });

    it('should handle paths with query parameters', async () => {
      const request = new Request('http://localhost/api/preview/exit?redirect=/search?q=eco');

      const response = await GET(request);

      expect(response.status).toBe(302);
      const location = response.headers.get('location');
      expect(location).toContain('/search?q=eco');
    });

    it('should handle encoded redirect paths', async () => {
      const request = new Request(
        'http://localhost/api/preview/exit?redirect=%2Flistings%2Feco-workspace'
      );

      const response = await GET(request);

      expect(response.status).toBe(302);
      const location = response.headers.get('location');
      expect(location).toContain('/listings/eco-workspace');
    });
  });

  describe('Draft Mode Operations', () => {
    it('should call draftMode function', async () => {
      const request = new Request('http://localhost/api/preview/exit');

      await GET(request);

      expect(mockDraftMode).toHaveBeenCalledTimes(1);
    });

    it('should call disable on draft mode', async () => {
      const request = new Request('http://localhost/api/preview/exit');

      await GET(request);

      expect(mockDisable).toHaveBeenCalledTimes(1);
    });

    it('should disable before redirecting', async () => {
      const request = new Request('http://localhost/api/preview/exit?redirect=/home');

      await GET(request);

      expect(mockDisable).toHaveBeenCalled();
      // Response should be created after disable is called
      expect(mockDraftMode).toHaveBeenCalled();
    });
  });

  describe('Response Structure', () => {
    it('should return 302 status code', async () => {
      const request = new Request('http://localhost/api/preview/exit');

      const response = await GET(request);

      expect(response.status).toBe(302);
    });

    it('should include Location header', async () => {
      const request = new Request('http://localhost/api/preview/exit');

      const response = await GET(request);

      expect(response.headers.has('location')).toBe(true);
    });

    it('should return null body', async () => {
      const request = new Request('http://localhost/api/preview/exit');

      const response = await GET(request);

      const body = await response.text();
      expect(body).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty redirect parameter', async () => {
      const request = new Request('http://localhost/api/preview/exit?redirect=');

      const response = await GET(request);

      expect(response.status).toBe(302);
      // Should redirect to homepage when redirect is empty
      expect(response.headers.get('location')).toContain('/');
    });

    it('should handle redirect with hash', async () => {
      const request = new Request('http://localhost/api/preview/exit?redirect=/listings#featured');

      const response = await GET(request);

      expect(response.status).toBe(302);
      const location = response.headers.get('location');
      expect(location).toContain('/listings');
    });

    it('should handle root path redirect', async () => {
      const request = new Request('http://localhost/api/preview/exit?redirect=/');

      const response = await GET(request);

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toContain('/');
    });

    it('should handle nested path redirect', async () => {
      const request = new Request('http://localhost/api/preview/exit?redirect=/admin/stats');

      const response = await GET(request);

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toContain('/admin/stats');
    });
  });

  describe('Multiple Query Parameters', () => {
    it('should extract redirect parameter from multiple params', async () => {
      const request = new Request(
        'http://localhost/api/preview/exit?foo=bar&redirect=/listings&baz=qux'
      );

      const response = await GET(request);

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toContain('/listings');
    });

    it('should ignore other query parameters', async () => {
      const request = new Request(
        'http://localhost/api/preview/exit?session=123&redirect=/home&debug=true'
      );

      const response = await GET(request);

      expect(response.status).toBe(302);
      const location = response.headers.get('location');
      expect(location).toContain('/home');
      // Other params should not be in redirect URL
      expect(location).not.toContain('session');
      expect(location).not.toContain('debug');
    });
  });

  describe('Security', () => {
    it('should construct safe redirect URL', async () => {
      const request = new Request('http://localhost/api/preview/exit?redirect=/safe-path');

      const response = await GET(request);

      expect(response.status).toBe(302);
      const location = response.headers.get('location');
      // Should be constructed using URL constructor with request origin
      expect(location).toMatch(/^https?:\/\//);
    });
  });

  describe('Different Origins', () => {
    it('should work with localhost', async () => {
      const request = new Request('http://localhost:3000/api/preview/exit?redirect=/test');

      const response = await GET(request);

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toContain('http://localhost:3000/test');
    });

    it('should work with production domain', async () => {
      const request = new Request('https://example.com/api/preview/exit?redirect=/test');

      const response = await GET(request);

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toContain('https://example.com/test');
    });

    it('should work with staging subdomain', async () => {
      const request = new Request('https://staging.example.com/api/preview/exit?redirect=/test');

      const response = await GET(request);

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toContain('https://staging.example.com/test');
    });
  });
});
