/**
 * Unit tests for listings.dal.ts
 * Tests the Data Access Layer for public listing data
 */

import { jest } from '@jest/globals';
import type { SanityListing } from '@/types/sanity.types';
import {
  getListingBySlug,
  getPopularListingSlugs,
  getRelatedListings,
} from '../listings.dal';

// Mock dependencies
jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: jest.fn(),
    withConfig: jest.fn(() => ({
      fetch: jest.fn(),
    })),
  },
}));

jest.mock('@/lib/dto-transformer', () => ({
  transformToDetailDTO: jest.fn(),
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

jest.mock('react', () => ({
  cache: jest.fn((fn) => fn),
}));

// Import mocked modules
import { client } from '@/lib/sanity/client';
import { transformToDetailDTO } from '@/lib/dto-transformer';
import { structuredLogger } from '@/lib/logger';

const mockFetch = client.fetch as jest.MockedFunction<typeof client.fetch>;
const mockTransformToDetailDTO = transformToDetailDTO as jest.MockedFunction<
  typeof transformToDetailDTO
>;

describe('listings.dal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getListingBySlug', () => {
    it('should fetch and transform listing data successfully', async () => {
      const mockListing: Partial<SanityListing> = {
        _id: 'listing-1',
        name: 'Test Listing',
        slug: { current: 'test-listing' },
      };

      const mockDTO = {
        id: 'listing-1',
        name: 'Test Listing',
        slug: 'test-listing',
        type: 'coworking',
        shortDescription: 'Test description',
        longDescription: 'Test long description',
        address: '123 Test St',
        location: { lat: 0, lng: 0 },
        website: 'https://test.com',
        priceRange: 'moderate' as const,
        contactPhone: null,
        contactEmail: null,
        imageUrl: null,
        galleryImages: [],
        ecoFocusTags: [],
        digitalNomadFeatures: [],
        amenities: [],
        city: null,
        coworkingDetails: null,
        cafeDetails: null,
        restaurantDetails: null,
        activitiesDetails: null,
        accommodationDetails: null,
      };

      mockFetch.mockResolvedValueOnce(mockListing as SanityListing);
      mockTransformToDetailDTO.mockReturnValueOnce(mockDTO);

      const result = await getListingBySlug('test-listing');

      expect(result).toEqual(mockDTO);
      expect(mockFetch).toHaveBeenCalledWith(expect.any(String), { slug: 'test-listing' });
      expect(mockTransformToDetailDTO).toHaveBeenCalledWith(mockListing);
    });

    it('should return null if listing is not found', async () => {
      mockFetch.mockResolvedValueOnce(null);

      const result = await getListingBySlug('non-existent');

      expect(result).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith(expect.any(String), { slug: 'non-existent' });
      expect(mockTransformToDetailDTO).not.toHaveBeenCalled();
    });

    it('should return null if transformation fails', async () => {
      const mockListing: Partial<SanityListing> = {
        _id: 'listing-1',
        name: 'Test Listing',
      };

      mockFetch.mockResolvedValueOnce(mockListing as SanityListing);
      mockTransformToDetailDTO.mockImplementationOnce(() => {
        throw new Error('Transform error');
      });

      const result = await getListingBySlug('test-listing');

      expect(result).toBeNull();
      expect(structuredLogger.error).toHaveBeenCalledWith(
        'Failed to transform listing payload',
        expect.any(Error),
        expect.objectContaining({ slug: 'test-listing' })
      );
    });

    it('should handle fetch errors', async () => {
      const mockError = new Error('Fetch failed');
      mockFetch.mockRejectedValueOnce(mockError);

      const result = await getListingBySlug('error-listing');

      expect(result).toBeNull();
      expect(structuredLogger.error).toHaveBeenCalledWith(
        'Failed to fetch listing details',
        mockError,
        expect.objectContaining({ slug: 'error-listing' })
      );
    });
  });

  describe('getRelatedListings', () => {
    it('should fetch related listings for a city', async () => {
      const mockRecords = [
        {
          _id: 'listing-2',
          name: 'Related Listing 1',
          slug: 'related-1',
          priceRange: 'budget',
          imageUrl: 'https://example.com/image1.jpg',
          city: {
            _id: 'city-1',
            name: 'Test City',
            country: 'Test Country',
            slug: 'test-city',
          },
          ecoFocusTags: [{ name: 'Solar Powered' }],
        },
        {
          _id: 'listing-3',
          name: 'Related Listing 2',
          slug: 'related-2',
          priceRange: 'premium',
          imageUrl: 'https://example.com/image2.jpg',
          city: {
            _id: 'city-1',
            name: 'Test City',
            country: 'Test Country',
            slug: 'test-city',
          },
          ecoFocusTags: [{ name: 'Recycling Program' }],
        },
      ];

      mockFetch.mockResolvedValueOnce(mockRecords);

      const result = await getRelatedListings('city-1', 'listing-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'listing-2',
        name: 'Related Listing 1',
        slug: 'related-1',
        priceRange: 'budget',
        ecoFocusTags: ['Solar Powered'],
      });
      expect(mockFetch).toHaveBeenCalledWith(expect.any(String), {
        cityId: 'city-1',
        excludeId: 'listing-1',
      });
    });

    it('should return empty array if cityId is not provided', async () => {
      const result = await getRelatedListings(undefined, 'listing-1');

      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return empty array if fetch returns null', async () => {
      mockFetch.mockResolvedValueOnce(null);

      const result = await getRelatedListings('city-1', 'listing-1');

      expect(result).toEqual([]);
    });

    it('should handle invalid price ranges', async () => {
      const mockRecords = [
        {
          _id: 'listing-2',
          name: 'Related Listing',
          slug: 'related-1',
          priceRange: 'invalid',
          imageUrl: 'https://example.com/image1.jpg',
          city: {
            _id: 'city-1',
            name: 'Test City',
            country: 'Test Country',
            slug: 'test-city',
          },
          ecoFocusTags: [],
        },
      ];

      mockFetch.mockResolvedValueOnce(mockRecords);

      const result = await getRelatedListings('city-1', 'listing-1');

      expect(result[0].priceRange).toBe('moderate'); // Default fallback
    });

    it('should handle fetch errors gracefully', async () => {
      const mockError = new Error('Fetch failed');
      mockFetch.mockRejectedValueOnce(mockError);

      const result = await getRelatedListings('city-1', 'listing-1');

      expect(result).toEqual([]);
      expect(structuredLogger.error).toHaveBeenCalledWith(
        'Failed to fetch related listings',
        mockError,
        expect.objectContaining({ cityId: 'city-1' })
      );
    });
  });

  describe('getPopularListingSlugs', () => {
    it('should return popular listing slugs', async () => {
      const mockSlugs = [{ slug: 'popular-1' }, { slug: 'popular-2' }];

      mockFetch.mockResolvedValueOnce(mockSlugs);

      const result = await getPopularListingSlugs();

      expect(result).toEqual([{ slug: 'popular-1' }, { slug: 'popular-2' }]);
      expect(mockFetch).toHaveBeenCalledWith(expect.any(String));
    });

    it('should fallback to first published listing if no popular listings', async () => {
      const mockFallbackSlugs = [{ slug: 'fallback-1' }];

      // First call returns empty array (no popular listings)
      mockFetch.mockResolvedValueOnce([]);
      // Second call returns fallback listing
      mockFetch.mockResolvedValueOnce(mockFallbackSlugs);

      const result = await getPopularListingSlugs();

      expect(result).toEqual([{ slug: 'fallback-1' }]);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should return placeholder if no listings exist', async () => {
      // First call returns empty array (no popular listings)
      mockFetch.mockResolvedValueOnce([]);
      // Second call returns empty array (no fallback listings)
      mockFetch.mockResolvedValueOnce([]);

      const result = await getPopularListingSlugs();

      expect(result).toEqual([{ slug: 'placeholder-listing' }]);
    });

    it('should handle errors and return placeholder', async () => {
      const mockError = new Error('Fetch failed');
      mockFetch.mockRejectedValueOnce(mockError);

      const result = await getPopularListingSlugs();

      expect(result).toEqual([{ slug: 'placeholder-listing' }]);
      expect(structuredLogger.error).toHaveBeenCalledWith(
        'Failed to generate static params for listings',
        mockError,
        expect.objectContaining({ component: 'listings.dal' })
      );
    });
  });
});
