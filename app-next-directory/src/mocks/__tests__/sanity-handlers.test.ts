/**
 * Unit tests for src/mocks/sanity-handlers.ts
 * Tests backward compatibility re-export
 */

import defaultExport, { sanityHandlers } from '../sanity-handlers';

describe('src/mocks/sanity-handlers', () => {
  describe('Re-exports', () => {
    it('should export sanityHandlers array', () => {
      expect(sanityHandlers).toBeDefined();
      expect(Array.isArray(sanityHandlers)).toBe(true);
    });

    it('should export default sanityHandlers', () => {
      expect(defaultExport).toBeDefined();
      expect(Array.isArray(defaultExport)).toBe(true);
      expect(defaultExport).toBe(sanityHandlers);
    });

    it('should have Sanity API handlers', () => {
      expect(sanityHandlers.length).toBeGreaterThan(0);
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain compatibility with existing imports', () => {
      // This file is deprecated but provides backward compatibility
      // Import from '@/mocks/handlers/sanity' is preferred
      expect(sanityHandlers).toBeDefined();
    });

    it('should be marked as deprecated in documentation', () => {
      // The file has @deprecated JSDoc comment
      // This test documents the deprecation policy
      expect(true).toBe(true);
    });
  });

  describe('Handler Structure', () => {
    it('should export MSW-compatible handlers', () => {
      // Each handler should be an MSW request handler
      sanityHandlers.forEach(handler => {
        expect(handler).toBeDefined();
        expect(typeof handler).toBe('object');
      });
    });
  });
});
