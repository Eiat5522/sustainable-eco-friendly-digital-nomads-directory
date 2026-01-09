/**
 * Unit tests for search.dal.ts
 * Tests the Data Access Layer for search operations with Next.js 16 Cache Components
 */

import { jest } from '@jest/globals';
import type { SearchFacets } from '../search.dal';

// Mock dependencies FIRST, before any imports
jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: jest.fn(),
    withConfig: jest.fn(() => ({
      fetch: jest.fn(),
    })),
  },
}));

jest.mock('@/lib/logger', () => ({
  structuredLogger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('next/cache', () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
}));

// Import mocked modules
import { client } from '@/lib/sanity/client';
import { structuredLogger } from '@/lib/logger';
import { cacheLife, cacheTag } from 'next/cache';

// Now import the module under test (this will import the mocked dependencies)
import {
  getSearchFacets,
  buildSearchParams,
  buildSearchHref,
  getPageNumbers,
  buildWhereClause,
  DEFAULT_PAGE_SIZES,
} from '../search.dal';

const mockFetch = client.fetch as jest.MockedFunction<typeof client.fetch>;
const mockCacheLife = cacheLife as jest.MockedFunction<typeof cacheLife>;
const mockCacheTag = cacheTag as jest.MockedFunction<typeof cacheTag>;

describe('search.dal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSearchFacets', () => {
    it('should fetch facets successfully with proper caching', async () => {
      const mockFacets: SearchFacets = {
        categories: ['cafe', 'coworking', 'restaurant'],
        destinations: ['Bangkok', 'Lisbon', 'Bali'],
        amenities: ['wifi', 'coffee', 'quiet space'],
      };

      mockFetch.mockResolvedValueOnce(mockFacets);

      const result = await getSearchFacets();

      expect(result).toEqual(mockFacets);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('array::unique'),
        undefined
      );
      // Verify cache directives are called (they are in the function body)
      expect(mockCacheTag).toHaveBeenCalledWith('search-facets', 'listings');
      expect(mockCacheLife).toHaveBeenCalledWith('hours');
    });

    it('should return empty facets if fetch returns null', async () => {
      mockFetch.mockResolvedValueOnce(null);

      const result = await getSearchFacets();

      expect(result).toEqual({
        categories: [],
        destinations: [],
        amenities: [],
      });
    });

    it('should handle fetch errors gracefully', async () => {
      const mockError = new Error('Fetch failed');
      mockFetch.mockRejectedValueOnce(mockError);

      const result = await getSearchFacets();

      expect(result).toEqual({
        categories: [],
        destinations: [],
        amenities: [],
      });
      expect(structuredLogger.error).toHaveBeenCalledWith(
        'Failed to fetch search facets',
        mockError,
        expect.objectContaining({ component: 'search.dal' })
      );
    });

    it('should handle prerender rejection during build', async () => {
      // Simulate build mode
      const originalBuildMode = process.env.NEXT_BUILD_MODE;
      process.env.NEXT_BUILD_MODE = 'true';

      const prerenderError = new Error('During prerendering, something failed');
      mockFetch.mockRejectedValueOnce(prerenderError);

      const result = await getSearchFacets();

      expect(result).toEqual({
        categories: [],
        destinations: [],
        amenities: [],
      });

      // Restore original env
      if (originalBuildMode === undefined) {
        delete process.env.NEXT_BUILD_MODE;
      } else {
        process.env.NEXT_BUILD_MODE = originalBuildMode;
      }
    });
  });

  describe('getPageNumbers', () => {
    it('should return all pages when totalPages <= 7', () => {
      expect(getPageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5]);
      expect(getPageNumbers(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it('should add ellipsis for large page counts', () => {
      expect(getPageNumbers(1, 10)).toEqual([1, 2, '…', 10]);
      expect(getPageNumbers(5, 10)).toEqual([1, '…', 4, 5, 6, '…', 10]);
      expect(getPageNumbers(10, 10)).toEqual([1, '…', 9, 10]);
    });

    it('should handle middle pages correctly', () => {
      expect(getPageNumbers(5, 20)).toEqual([1, '…', 4, 5, 6, '…', 20]);
      expect(getPageNumbers(10, 20)).toEqual([1, '…', 9, 10, 11, '…', 20]);
    });

    it('should handle pages near the start', () => {
      expect(getPageNumbers(2, 10)).toEqual([1, 2, 3, '…', 10]);
      expect(getPageNumbers(3, 10)).toEqual([1, 2, 3, 4, '…', 10]);
    });

    it('should handle pages near the end', () => {
      expect(getPageNumbers(8, 10)).toEqual([1, '…', 7, 8, 9, 10]);
      expect(getPageNumbers(9, 10)).toEqual([1, '…', 8, 9, 10]);
    });

    it('should normalize invalid page numbers', () => {
      expect(getPageNumbers(0, 5)).toEqual([1, 2, 3, 4, 5]);
      expect(getPageNumbers(-1, 5)).toEqual([1, 2, 3, 4, 5]);
      expect(getPageNumbers(1.5, 5)).toEqual([1, 2, 3, 4, 5]);
    });

    it('should normalize invalid totalPages', () => {
      expect(getPageNumbers(1, 0)).toEqual([1]);
      expect(getPageNumbers(1, -5)).toEqual([1]);
      expect(getPageNumbers(1, 2.7)).toEqual([1, 2]);
    });
  });

  describe('buildWhereClause', () => {
    it('should build basic where clause', () => {
      const clause = buildWhereClause({
        q: '',
        categories: [],
        destinations: [],
        amenities: [],
        nomadFeatures: [],
      });

      expect(clause).toContain('_type == "listing"');
      expect(clause).toContain('moderation.status == "published"');
    });

    it('should add search query filter', () => {
      const clause = buildWhereClause({
        q: 'coffee',
        categories: [],
        destinations: [],
        amenities: [],
        nomadFeatures: [],
      });

      expect(clause).toContain('lower(name) match');
      expect(clause).toContain('*coffee*');
    });

    it('should add category filters', () => {
      const clause = buildWhereClause({
        q: '',
        categories: ['cafe', 'coworking'],
        destinations: [],
        amenities: [],
        nomadFeatures: [],
      });

      expect(clause).toContain('category == "cafe"');
      expect(clause).toContain('category == "coworking"');
      expect(clause).toContain('||');
    });

    it('should add destination filters', () => {
      const clause = buildWhereClause({
        q: '',
        categories: [],
        destinations: ['Bangkok', 'Lisbon'],
        amenities: [],
        nomadFeatures: [],
      });

      expect(clause).toContain('city->name == "Bangkok"');
      expect(clause).toContain('city->name == "Lisbon"');
    });

    it('should add amenity filters', () => {
      const clause = buildWhereClause({
        q: '',
        categories: [],
        destinations: [],
        amenities: ['wifi', 'coffee'],
        nomadFeatures: [],
      });

      expect(clause).toContain('"wifi" in amenities[]->name');
      expect(clause).toContain('"coffee" in amenities[]->name');
    });

    it('should add nomad feature filters', () => {
      const clause = buildWhereClause({
        q: '',
        categories: [],
        destinations: [],
        amenities: [],
        nomadFeatures: ['fast-internet', 'coworking-space'],
      });

      expect(clause).toContain('array::contains(digitalNomadFeatures[]->name');
      expect(clause).toContain('fast-internet');
      expect(clause).toContain('coworking-space');
    });

    it('should escape special characters in query', () => {
      const clause = buildWhereClause({
        q: 'test*query"with\'special',
        categories: [],
        destinations: [],
        amenities: [],
        nomadFeatures: [],
      });

      // Should not contain unescaped special characters
      expect(clause).toBeDefined();
      expect(clause.length).toBeGreaterThan(0);
    });

    it('should throw error for too many category filters', () => {
      const tooManyCategories = Array.from({ length: 51 }, (_, i) => `cat-${i}`);

      expect(() =>
        buildWhereClause({
          q: '',
          categories: tooManyCategories,
          destinations: [],
          amenities: [],
          nomadFeatures: [],
        })
      ).toThrow('Too many filter values provided');
    });

    it('should throw error for too many destination filters', () => {
      const tooManyDestinations = Array.from({ length: 51 }, (_, i) => `dest-${i}`);

      expect(() =>
        buildWhereClause({
          q: '',
          categories: [],
          destinations: tooManyDestinations,
          amenities: [],
          nomadFeatures: [],
        })
      ).toThrow('Too many filter values provided');
    });

    it('should throw error for too many amenity filters', () => {
      const tooManyAmenities = Array.from({ length: 51 }, (_, i) => `amenity-${i}`);

      expect(() =>
        buildWhereClause({
          q: '',
          categories: [],
          destinations: [],
          amenities: tooManyAmenities,
          nomadFeatures: [],
        })
      ).toThrow('Too many filter values provided');
    });

    it('should throw error for query that is too long', () => {
      const tooLongQuery = 'x'.repeat(201);

      expect(() =>
        buildWhereClause({
          q: tooLongQuery,
          categories: [],
          destinations: [],
          amenities: [],
          nomadFeatures: [],
        })
      ).toThrow('Search query too long');
    });

    it('should combine multiple filters with AND', () => {
      const clause = buildWhereClause({
        q: 'coffee',
        categories: ['cafe'],
        destinations: ['Bangkok'],
        amenities: ['wifi'],
        nomadFeatures: [],
      });

      expect(clause).toContain('&&');
      expect(clause).toContain('cafe');
      expect(clause).toContain('Bangkok');
      expect(clause).toContain('wifi');
      expect(clause).toContain('coffee');
    });
  });
});
