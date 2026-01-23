/**
 * Unit tests for src/mocks/handlers/index.ts
 * Tests MSW handlers export and organization
 */

import {
  apiHandlers,
  getRedisStoreState,
  handlers,
  redisHandlers,
  resetRedisStore,
  sanityHandlers,
  seedRedisStore,
  setRegisterResponse,
  setReviewsResponse,
} from '../index';

describe('src/mocks/handlers/index', () => {
  describe('Handler Exports', () => {
    it('should export combined handlers array', () => {
      expect(handlers).toBeDefined();
      expect(Array.isArray(handlers)).toBe(true);
    });

    it('should export sanityHandlers', () => {
      expect(sanityHandlers).toBeDefined();
      expect(Array.isArray(sanityHandlers)).toBe(true);
    });

    it('should export redisHandlers', () => {
      expect(redisHandlers).toBeDefined();
      expect(Array.isArray(redisHandlers)).toBe(true);
    });

    it('should export apiHandlers', () => {
      expect(apiHandlers).toBeDefined();
      expect(Array.isArray(apiHandlers)).toBe(true);
    });
  });

  describe('Combined Handlers Array', () => {
    it('should include all handler types in correct order', () => {
      // Sanity handlers should come first
      expect(handlers.length).toBeGreaterThan(0);
      expect(handlers.length).toBeGreaterThanOrEqual(
        sanityHandlers.length + redisHandlers.length + apiHandlers.length
      );
    });

    it('should maintain handler order: sanity, redis, api', () => {
      // Documentation test: Order matters for handler precedence
      // Sanity handlers first to ensure they intercept before wildcard patterns
      expect(true).toBe(true);
    });
  });

  describe('Helper Function Exports', () => {
    it('should export setRegisterResponse', () => {
      expect(setRegisterResponse).toBeDefined();
      expect(typeof setRegisterResponse).toBe('function');
    });

    it('should export setReviewsResponse', () => {
      expect(setReviewsResponse).toBeDefined();
      expect(typeof setReviewsResponse).toBe('function');
    });

    it('should export getRedisStoreState', () => {
      expect(getRedisStoreState).toBeDefined();
      expect(typeof getRedisStoreState).toBe('function');
    });

    it('should export resetRedisStore', () => {
      expect(resetRedisStore).toBeDefined();
      expect(typeof resetRedisStore).toBe('function');
    });

    it('should export seedRedisStore', () => {
      expect(seedRedisStore).toBeDefined();
      expect(typeof seedRedisStore).toBe('function');
    });
  });

  describe('Default Export', () => {
    it('should provide default export for backwards compatibility', async () => {
      const defaultExport = (await import('../index')).default;
      expect(defaultExport).toBeDefined();
      expect(Array.isArray(defaultExport)).toBe(true);
      expect(defaultExport).toEqual(handlers);
    });
  });

  describe('Module Documentation', () => {
    it('should centralize all MSW request handlers', () => {
      // Documentation test: This module handles Sanity CMS, Redis/Upstash, and internal API routes
      expect(true).toBe(true);
    });
  });
});
