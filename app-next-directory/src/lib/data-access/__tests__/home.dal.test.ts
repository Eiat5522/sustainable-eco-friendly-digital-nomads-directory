/**
 * Unit tests for home.dal.ts
 * Tests the Data Access Layer for home page data
 */

import { jest } from '@jest/globals';
import {
  getFeaturedListings,
  getCities,
  getEcoTags,
  getHomePageData,
} from '../home.dal';

// Mock dependencies
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

const mockFetch = client.fetch as jest.MockedFunction<typeof client.fetch>;

describe('home.dal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFeaturedListings', () => {
    it('should fetch and map featured listings successfully', async () => {
      const mockListings = [
        {
          _id: 'listing-1',
          name: 'Test Listing 1',
          slug: 'test-listing-1',
          primaryImage: { asset: { url: 'https://example.com/image1.jpg' } },
          city: { name: 'Bangkok' },
        },
        {
          _id: 'listing-2',
          name: 'Test Listing 2',
          slug: 'test-listing-2',
          primaryImage: { asset: { url: 'https://example.com/image2.jpg' } },
          city: 'Chiang Mai',
        },
      ];

      mockFetch.mockResolvedValueOnce(mockListings);

      const result = await getFeaturedListings(10);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'listing-1',
        name: 'Test Listing 1',
        slug: 'test-listing-1',
        imageUrl: 'https://example.com/image1.jpg',
        city: 'Bangkok',
        amenityNames: [],
      });
      expect(result[1]).toEqual({
        id: 'listing-2',
        name: 'Test Listing 2',
        slug: 'test-listing-2',
        imageUrl: 'https://example.com/image2.jpg',
        city: 'Chiang Mai',
        amenityNames: [],
      });
      expect(mockFetch).toHaveBeenCalledWith(expect.any(String), { limit: 10 });
    });

    it('should return empty array if fetch returns null', async () => {
      mockFetch.mockResolvedValueOnce(null);

      const result = await getFeaturedListings();

      expect(result).toEqual([]);
    });

    it('should filter out invalid listings with missing required fields', async () => {
      const mockListings = [
        {
          _id: 'listing-1',
          name: 'Valid Listing',
          slug: 'valid-listing',
        },
        {
          _id: 'listing-2',
          // Missing name
          slug: 'invalid-listing',
        },
        {
          _id: 'listing-3',
          name: 'Another Valid',
          slug: 'another-valid',
        },
        {
          // Missing _id
          name: 'No ID',
          slug: 'no-id',
        },
      ];

      mockFetch.mockResolvedValueOnce(mockListings);

      const result = await getFeaturedListings();

      expect(result).toHaveLength(2);
      expect(result.map((l) => l.id)).toEqual(['listing-1', 'listing-3']);
    });

    it('should handle different city formats', async () => {
      const mockListings = [
        {
          _id: 'listing-1',
          name: 'Test 1',
          slug: 'test-1',
          city: { name: 'Bangkok' },
        },
        {
          _id: 'listing-2',
          name: 'Test 2',
          slug: 'test-2',
          city: 'Chiang Mai',
        },
        {
          _id: 'listing-3',
          name: 'Test 3',
          slug: 'test-3',
          city: { name: '' }, // Empty name
        },
        {
          _id: 'listing-4',
          name: 'Test 4',
          slug: 'test-4',
          // No city
        },
      ];

      mockFetch.mockResolvedValueOnce(mockListings);

      const result = await getFeaturedListings();

      expect(result[0].city).toBe('Bangkok');
      expect(result[1].city).toBe('Chiang Mai');
      expect(result[2].city).toBe('');
      expect(result[3].city).toBe('');
    });
  });

  describe('getCities', () => {
    it('should fetch and map cities successfully', async () => {
      const mockCities = [
        {
          _id: 'city-1',
          title: 'Bangkok',
          slug: { current: 'bangkok' },
          country: 'Thailand',
          description: 'Capital city',
          sustainabilityScore: 85,
          highlights: ['Green spaces', 'Public transport'],
          primaryImage: { asset: { url: 'https://example.com/city1.jpg' } },
        },
        {
          _id: 'city-2',
          title: 'Chiang Mai',
          slug: 'chiang-mai',
          country: 'Thailand',
          sustainabilityScore: 90,
        },
      ];

      mockFetch.mockResolvedValueOnce(mockCities);

      const result = await getCities(8);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'city-1',
        name: 'Bangkok',
        slug: 'bangkok',
        country: 'Thailand',
        description: 'Capital city',
        sustainabilityScore: 85,
        highlights: ['Green spaces', 'Public transport'],
        imageUrl: 'https://example.com/city1.jpg',
      });
      expect(result[1]).toEqual({
        id: 'city-2',
        name: 'Chiang Mai',
        slug: 'chiang-mai',
        country: 'Thailand',
        sustainabilityScore: 90,
        highlights: undefined,
        imageUrl: null,
      });
      expect(mockFetch).toHaveBeenCalledWith(expect.any(String), { limit: 8 });
    });

    it('should return empty array if fetch returns null', async () => {
      mockFetch.mockResolvedValueOnce(null);

      const result = await getCities();

      expect(result).toEqual([]);
    });

    it('should filter out cities with missing required fields', async () => {
      const mockCities = [
        {
          _id: 'city-1',
          title: 'Valid City',
          slug: { current: 'valid' },
        },
        {
          _id: 'city-2',
          // Missing title
          slug: { current: 'invalid' },
        },
        {
          // Missing _id
          title: 'No ID',
          slug: { current: 'no-id' },
        },
        {
          _id: 'city-3',
          title: 'No Slug',
          // Missing slug
        },
      ];

      mockFetch.mockResolvedValueOnce(mockCities);

      const result = await getCities();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('city-1');
    });

    it('should handle slug as string or object', async () => {
      const mockCities = [
        {
          _id: 'city-1',
          title: 'City 1',
          slug: { current: 'city-1' },
        },
        {
          _id: 'city-2',
          title: 'City 2',
          slug: 'city-2',
        },
      ];

      mockFetch.mockResolvedValueOnce(mockCities);

      const result = await getCities();

      expect(result[0].slug).toBe('city-1');
      expect(result[1].slug).toBe('city-2');
    });

    it('should validate sustainability score range', async () => {
      const mockCities = [
        {
          _id: 'city-1',
          title: 'Valid Score',
          slug: 'valid',
          sustainabilityScore: 75,
        },
        {
          _id: 'city-2',
          title: 'Out of Range High',
          slug: 'high',
          sustainabilityScore: 150,
        },
        {
          _id: 'city-3',
          title: 'Out of Range Low',
          slug: 'low',
          sustainabilityScore: -10,
        },
        {
          _id: 'city-4',
          title: 'Edge Case Max',
          slug: 'max',
          sustainabilityScore: 100,
        },
        {
          _id: 'city-5',
          title: 'Edge Case Min',
          slug: 'min',
          sustainabilityScore: 0,
        },
      ];

      mockFetch.mockResolvedValueOnce(mockCities);

      const result = await getCities();

      expect(result[0].sustainabilityScore).toBe(75);
      expect(result[1].sustainabilityScore).toBeUndefined();
      expect(result[2].sustainabilityScore).toBeUndefined();
      expect(result[3].sustainabilityScore).toBe(100);
      expect(result[4].sustainabilityScore).toBe(0);
    });

    it('should filter out non-string highlights', async () => {
      const mockCities = [
        {
          _id: 'city-1',
          title: 'City 1',
          slug: 'city-1',
          highlights: ['Valid', '', 'Another Valid', null, 123, 'Last Valid'],
        },
      ];

      mockFetch.mockResolvedValueOnce(mockCities);

      const result = await getCities();

      expect(result[0].highlights).toEqual(['Valid', 'Another Valid', 'Last Valid']);
    });

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getCities();

      expect(result).toEqual([]);
      expect(structuredLogger.error).toHaveBeenCalledWith(
        'Failed to fetch cities',
        expect.any(Error),
        expect.objectContaining({ component: 'home.dal' })
      );
    });
  });

  describe('getEcoTags', () => {
    it('should fetch and map eco tags successfully', async () => {
      const mockTags = [
        {
          _id: 'tag-1',
          name: 'Solar Power',
          slug: 'solar-power',
          description: 'Uses solar energy',
        },
        {
          _id: 'tag-2',
          name: 'Zero Waste',
          slug: 'zero-waste',
        },
      ];

      mockFetch.mockResolvedValueOnce(mockTags);

      const result = await getEcoTags();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'tag-1',
        name: 'Solar Power',
        slug: 'solar-power',
        description: 'Uses solar energy',
      });
      expect(result[1]).toEqual({
        id: 'tag-2',
        name: 'Zero Waste',
        slug: 'zero-waste',
        description: undefined,
      });
    });

    it('should return empty array if fetch returns null', async () => {
      mockFetch.mockResolvedValueOnce(null);

      const result = await getEcoTags();

      expect(result).toEqual([]);
    });

    it('should filter out tags with missing required fields', async () => {
      const mockTags = [
        {
          _id: 'tag-1',
          name: 'Valid Tag',
          slug: 'valid',
        },
        {
          _id: 'tag-2',
          // Missing name
          slug: 'invalid',
        },
        {
          // Missing _id
          name: 'No ID',
          slug: 'no-id',
        },
        {
          _id: 'tag-3',
          name: 'No Slug',
          // Missing slug
        },
      ];

      mockFetch.mockResolvedValueOnce(mockTags);

      const result = await getEcoTags();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tag-1');
    });

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Database error'));

      const result = await getEcoTags();

      expect(result).toEqual([]);
      expect(structuredLogger.error).toHaveBeenCalledWith(
        'Failed to fetch eco tags',
        expect.any(Error),
        expect.objectContaining({ component: 'home.dal' })
      );
    });
  });

  describe('getHomePageData', () => {
    it('should fetch both featured listings and cities in parallel', async () => {
      const mockListings = [
        {
          _id: 'listing-1',
          name: 'Test Listing',
          slug: 'test-listing',
        },
      ];

      const mockCities = [
        {
          _id: 'city-1',
          title: 'Bangkok',
          slug: 'bangkok',
        },
      ];

      // First call for listings, second for cities
      mockFetch
        .mockResolvedValueOnce(mockListings)
        .mockResolvedValueOnce(mockCities);

      const result = await getHomePageData(10, 8);

      expect(result).toHaveProperty('featuredListings');
      expect(result).toHaveProperty('cities');
      expect(result.featuredListings).toHaveLength(1);
      expect(result.cities).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should use default limits when not provided', async () => {
      mockFetch
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await getHomePageData();

      expect(result.featuredListings).toEqual([]);
      expect(result.cities).toEqual([]);
      expect(mockFetch).toHaveBeenCalledWith(expect.any(String), { limit: 10 });
      expect(mockFetch).toHaveBeenCalledWith(expect.any(String), { limit: 8 });
    });

    it('should handle errors in both fetches gracefully', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Listings error'))
        .mockRejectedValueOnce(new Error('Cities error'));

      const result = await getHomePageData();

      expect(result.featuredListings).toEqual([]);
      expect(result.cities).toEqual([]);
    });
  });
});
