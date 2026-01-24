/**
 * Unit tests for src/lib/image-utils/index.ts
 * Tests re-export of image utility functions
 */

import type { ImageDimensions } from '../index';
import { getImageDimensions } from '../index';

// Mock the actual getImageDimensions module
jest.mock('../getImageDimensions', () => ({
  getImageDimensions: jest.fn(),
}));

describe('src/lib/image-utils/index', () => {
  describe('Module Exports', () => {
    it('should export getImageDimensions function', () => {
      expect(getImageDimensions).toBeDefined();
      expect(typeof getImageDimensions).toBe('function');
    });

    it('should export ImageDimensions type', () => {
      // Type check - this will fail at compile time if type is not exported
      const dimensions: ImageDimensions = { width: 100, height: 100 };
      expect(dimensions).toBeDefined();
    });
  });

  describe('getImageDimensions re-export', () => {
    it('should call the underlying getImageDimensions implementation', async () => {
      const mockGetImageDimensions = getImageDimensions as jest.MockedFunction<
        typeof getImageDimensions
      >;
      mockGetImageDimensions.mockResolvedValueOnce({ width: 800, height: 600 });

      const result = await getImageDimensions('test.jpg');

      expect(mockGetImageDimensions).toHaveBeenCalledWith('test.jpg');
      expect(result).toEqual({ width: 800, height: 600 });
    });
  });
});
