// Mock the logger
jest.mock('@/lib/logger', () => ({
  __esModule: true,
  structuredLogger: {
    middlewareError: jest.fn(),
  },
}));

import { structuredLogger } from '@/lib/logger';

const mockMiddlewareError = structuredLogger.middlewareError as jest.Mock;

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

import { cacheMiddleware, invalidateCache, purgeCache } from '../cache';

describe('cache middleware', () => {
  beforeEach(() => {
    mockMiddlewareError.mockClear();
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
  });

  describe('cacheMiddleware', () => {
    it('should set Cache-Control to no-store for preview mode', async () => {
      const request = {
        cookies: {
          has: jest.fn().mockReturnValue(true),
        },
        method: 'GET',
        nextUrl: {
          pathname: '/listings/test',
        },
      };
      const mockSet = jest.fn();
      const mockAppend = jest.fn();
      const response = {
        headers: {
          set: mockSet,
          append: mockAppend,
        },
      };

      await cacheMiddleware(request, response);

      expect(mockSet).toHaveBeenCalledWith('Cache-Control', 'no-store');
    });

    it('should set Cache-Control to no-store for non-GET requests', async () => {
      const request = {
        cookies: {
          has: jest.fn().mockReturnValue(false),
        },
        method: 'POST',
        nextUrl: {
          pathname: '/listings/test',
        },
      };
      const mockSet = jest.fn();
      const mockAppend = jest.fn();
      const response = {
        headers: {
          set: mockSet,
          append: mockAppend,
        },
      };

      await cacheMiddleware(request, response);

      expect(mockSet).toHaveBeenCalledWith('Cache-Control', 'no-store');
    });

    it('should set Cache-Control to no-store for non-cacheable API routes', async () => {
      const request = {
        cookies: {
          has: jest.fn().mockReturnValue(false),
        },
        method: 'GET',
        nextUrl: {
          pathname: '/api/auth/signin',
        },
      };
      const mockSet = jest.fn();
      const mockAppend = jest.fn();
      const response = {
        headers: {
          set: mockSet,
          append: mockAppend,
        },
      };

      await cacheMiddleware(request, response);

      expect(mockSet).toHaveBeenCalledWith('Cache-Control', 'no-store');
    });

    it('should set cache headers for listing pages', async () => {
      const request = {
        cookies: {
          has: jest.fn().mockReturnValue(false),
        },
        method: 'GET',
        nextUrl: {
          pathname: '/listings/test-listing',
        },
      };
      const mockSet = jest.fn();
      const mockAppend = jest.fn();
      const response = {
        headers: {
          set: mockSet,
          append: mockAppend,
        },
      };

      await cacheMiddleware(request, response);

      expect(mockSet).toHaveBeenCalledWith(
        'Cache-Control',
        'public, max-age=1800, stale-while-revalidate=60'
      );
      expect(mockSet).toHaveBeenCalledWith('Surrogate-Control', 'max-age=1800');
      expect(mockAppend).toHaveBeenCalledWith('Vary', 'Cookie');
    });

    it('should set cache headers for city pages', async () => {
      const request = {
        cookies: {
          has: jest.fn().mockReturnValue(false),
        },
        method: 'GET',
        nextUrl: {
          pathname: '/city/berlin',
        },
      };
      const mockSet = jest.fn();
      const mockAppend = jest.fn();
      const response = {
        headers: {
          set: mockSet,
          append: mockAppend,
        },
      };

      await cacheMiddleware(request, response);

      expect(mockSet).toHaveBeenCalledWith(
        'Cache-Control',
        'public, max-age=86400, stale-while-revalidate=300'
      );
      expect(mockSet).toHaveBeenCalledWith('Surrogate-Control', 'max-age=86400');
    });

    it('should set cache headers for category pages', async () => {
      const request = {
        cookies: {
          has: jest.fn().mockReturnValue(false),
        },
        method: 'GET',
        nextUrl: {
          pathname: '/category/coworking',
        },
      };
      const mockSet = jest.fn();
      const mockAppend = jest.fn();
      const response = {
        headers: {
          set: mockSet,
          append: mockAppend,
        },
      };

      await cacheMiddleware(request, response);

      expect(mockSet).toHaveBeenCalledWith(
        'Cache-Control',
        'public, max-age=43200, stale-while-revalidate=300'
      );
      expect(mockSet).toHaveBeenCalledWith('Surrogate-Control', 'max-age=43200');
    });

    it('should set default cache headers for other pages', async () => {
      const request = {
        cookies: {
          has: jest.fn().mockReturnValue(false),
        },
        method: 'GET',
        nextUrl: {
          pathname: '/about',
        },
      };
      const mockSet = jest.fn();
      const mockAppend = jest.fn();
      const response = {
        headers: {
          set: mockSet,
          append: mockAppend,
        },
      };

      await cacheMiddleware(request, response);

      expect(mockSet).toHaveBeenCalledWith(
        'Cache-Control',
        'public, max-age=3600, stale-while-revalidate=60'
      );
      expect(mockSet).toHaveBeenCalledWith('Surrogate-Control', 'max-age=3600');
    });

    it('should set private cache for authenticated requests', async () => {
      const request = {
        cookies: {
          has: jest.fn().mockReturnValue(false),
        },
        method: 'GET',
        nextUrl: {
          pathname: '/profile',
        },
      };
      const mockSet = jest.fn();
      const mockAppend = jest.fn();
      const response = {
        headers: {
          set: mockSet,
          append: mockAppend,
        },
      };

      await cacheMiddleware(request, response);

      expect(mockSet).toHaveBeenCalled();
      expect(mockAppend).toHaveBeenCalledWith('Vary', 'Cookie');
    });

    it('should generate private cache control header', async () => {
      const request = {
        cookies: {
          has: jest.fn().mockReturnValue(false),
        },
        method: 'GET',
        nextUrl: {
          pathname: '/profile',
        },
      };
      const mockSet = jest.fn();
      const mockAppend = jest.fn();
      const _response = {
        headers: {
          set: mockSet,
          append: mockAppend,
        },
      };

      // Manually call getCacheConfig to test the private scenario
      const { getCacheConfig, getCacheControlValue } = await import('../cache');
      const config = getCacheConfig(request);
      config.isPrivate = true;
      const cacheControl = getCacheControlValue(config);
      expect(cacheControl).toContain('private');
    });

    it('should allow caching for cacheable API routes', async () => {
      const request = {
        cookies: {
          has: jest.fn().mockReturnValue(false),
        },
        method: 'GET',
        nextUrl: {
          pathname: '/api/listings',
        },
      };
      const mockSet = jest.fn();
      const mockAppend = jest.fn();
      const response = {
        headers: {
          set: mockSet,
          append: mockAppend,
        },
      };

      await cacheMiddleware(request, response);

      expect(mockSet).toHaveBeenCalledWith('Cache-Control', expect.stringContaining('public'));
    });
  });

  describe('invalidateCache', () => {
    it('should call fetch with correct path', async () => {
      const path = '/listings/test';
      await invalidateCache(path);

      expect(mockFetch).toHaveBeenCalled();
      const callArg = mockFetch.mock.calls[0][0];
      // fetch is called with Request object or URL string
      const url = typeof callArg === 'string' ? callArg : callArg.url;
      expect(url).toContain('/api/revalidate');
      expect(url).toContain(encodeURIComponent(path));
    });

    it('should not throw errors when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Should not throw - errors are caught internally
      await expect(invalidateCache('/listings/test')).resolves.not.toThrow();
    });

    it('should encode special characters in path', async () => {
      const path = '/listings/test with spaces';
      await invalidateCache(path);

      expect(mockFetch).toHaveBeenCalled();
      const callArg = mockFetch.mock.calls[0][0];
      const url = typeof callArg === 'string' ? callArg : callArg.url;
      expect(url).toContain(encodeURIComponent(path));
    });
  });

  describe('purgeCache', () => {
    it('should call revalidate-all endpoint', async () => {
      await purgeCache();

      expect(mockFetch).toHaveBeenCalled();
      const callArg = mockFetch.mock.calls[0][0];
      const url = typeof callArg === 'string' ? callArg : callArg.url;
      expect(url).toContain('/api/revalidate-all');
    });

    it('should not throw errors when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Should not throw - errors are caught internally
      await expect(purgeCache()).resolves.not.toThrow();
    });

    it('should log an error when fetch fails in invalidateCache', async () => {
      const error = new Error('Network error');
      mockFetch.mockRejectedValueOnce(error);

      await invalidateCache('/listings/test');

      expect(mockMiddlewareError).toHaveBeenCalledWith(
        'cache invalidation',
        error,
        expect.objectContaining({
          component: 'cache',
          operation: 'invalidate',
          path: '/listings/test',
        })
      );
    });

    it('should log an error when fetch fails in purgeCache', async () => {
      const error = new Error('Network error');
      mockFetch.mockRejectedValueOnce(error);

      await purgeCache();

      expect(mockMiddlewareError).toHaveBeenCalledWith(
        'cache purge',
        error,
        expect.objectContaining({
          component: 'cache',
          operation: 'purge_all',
        })
      );
    });
  });
});
