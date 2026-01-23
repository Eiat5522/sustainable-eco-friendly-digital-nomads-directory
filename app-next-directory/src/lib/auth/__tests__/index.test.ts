/**
 * Unit tests for src/lib/auth/index.ts
 * Tests re-export of auth modules
 */

import * as authIndex from '../index';

describe('src/lib/auth/index', () => {
  describe('Module Exports', () => {
    it('should export auth function', () => {
      expect(authIndex.auth).toBeDefined();
      expect(typeof authIndex.auth).toBe('function');
    });

    it('should export authOptions', () => {
      expect(authIndex.authOptions).toBeDefined();
      expect(typeof authIndex.authOptions).toBe('object');
    });

    it('should export GET handler', () => {
      expect(authIndex.GET).toBeDefined();
      expect(typeof authIndex.GET).toBe('function');
    });

    it('should export POST handler', () => {
      expect(authIndex.POST).toBeDefined();
      expect(typeof authIndex.POST).toBe('function');
    });

    it('should export getToken function', () => {
      expect(authIndex.getToken).toBeDefined();
      expect(typeof authIndex.getToken).toBe('function');
    });
  });

  describe('Re-exports from auth module', () => {
    it('should provide consistent API surface', () => {
      // Verify all exports are available
      const exports = Object.keys(authIndex);
      expect(exports).toContain('auth');
      expect(exports).toContain('authOptions');
      expect(exports).toContain('GET');
      expect(exports).toContain('POST');
      expect(exports).toContain('getToken');
    });
  });
});
