/**
 * Tests for data.ts - Sanity data fetching functions
 */

import { structuredLogger } from '@/lib/logger';
import { client } from './client';
import { getListingData } from './data';

// Mock the client module
const mockFetch = jest.fn();
const mockClientInstance = {
  fetch: mockFetch,
};
jest.mock('./client', () => ({
  client: jest.fn(() => mockClientInstance),
}));

// Mock the listings module
jest.mock('@/lib/listings', () => ({
  mapSanityListingToAppListingDetail: jest.fn(listing => ({
    ...listing,
    mapped: true,
  })),
}));

// Mock the logger
jest.mock('@/lib/logger', () => ({
  structuredLogger: {
    error: jest.fn(),
  },
}));

describe('data.ts', () => {
  const mockClient = client as jest.Mock<() => { fetch: jest.Mock }>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getListingData', () => {
    it('should fetch and map listing data by slug', async () => {
      const mockListing = {
        _id: 'listing-123',
        name: 'Test Listing',
        slug: 'test-listing',
        city: {
          _id: 'city-456',
          name: 'Test City',
          slug: 'test-city',
          country: 'Test Country',
        },
        type: 'coworking',
        priceRange: '$$',
        website: 'https://test.com',
      };

      mockClient().fetch.mockResolvedValue(mockListing);

      const result = await getListingData('test-listing');

      expect(mockClient().fetch).toHaveBeenCalledWith(
        expect.stringContaining('*[_type == "listing" && slug.current == $slug]'),
        { slug: 'test-listing' }
      );
      expect(result).toEqual({
        ...mockListing,
        mapped: true,
      });
    });

    it('should return null when listing is not found', async () => {
      mockClient().fetch.mockResolvedValue(null);

      const result = await getListingData('non-existent-slug');

      expect(mockClient().fetch).toHaveBeenCalledWith(
        expect.stringContaining('*[_type == "listing" && slug.current == $slug]'),
        { slug: 'non-existent-slug' }
      );
      expect(result).toBeNull();
    });

    it('should handle fetch errors gracefully', async () => {
      const errorSpy = jest.spyOn(structuredLogger, 'error').mockImplementation(() => {});
      mockClient().fetch.mockRejectedValue(new Error('Network error'));

      const result = await getListingData('error-slug');

      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalledWith(
        'Error fetching listing data for slug: error-slug',
        expect.any(Error)
      );

      errorSpy.mockRestore();
    });

    it('should accept usePreview parameter', async () => {
      const mockListing = {
        _id: 'listing-123',
        name: 'Preview Listing',
        slug: 'preview-listing',
      };

      mockClient().fetch.mockResolvedValue(mockListing);

      await getListingData('preview-listing', true);

      expect(mockClient().fetch).toHaveBeenCalled();
    });

    it('should handle listings with complete data structure', async () => {
      const mockListing = {
        _id: 'listing-full',
        name: 'Full Listing',
        slug: 'full-listing',
        city: {
          _id: 'city-full',
          name: 'Full City',
          slug: 'full-city',
          country: 'Full Country',
        },
        type: 'coworking',
        category: 'hotel',
        address: '123 Test St',
        location: { lat: 0, lng: 0, alt: 0 },
        primaryImage: { asset: { _ref: 'image-ref' } },
        galleryImages: [{ asset: { _ref: 'image-ref-2' } }],
        ecoFocusTags: [{ _id: 'tag-1', name: 'Eco-Friendly' }],
        priceRange: '$$$',
        contactPhone: '+1234567890',
        contactEmail: 'test@test.com',
        website: 'https://full-listing.com',
        shortDescription: 'Short desc',
        longDescription: 'Long desc',
        reviews: [],
        amenities: [],
        coworkingDetails: {},
        accommodationDetails: {},
        cafeDetails: {},
        restaurantDetails: {},
        activitiesDetails: {},
        digitalNomadFeatures: [],
        moderation: { status: 'published', featured: true, verificationStatus: 'verified' },
      };

      mockClient().fetch.mockResolvedValue(mockListing);

      const result = await getListingData('full-listing');

      expect(result).toEqual({
        ...mockListing,
        mapped: true,
      });
    });

    it('should handle listings with minimal data', async () => {
      const mockListing = {
        _id: 'listing-minimal',
        name: 'Minimal Listing',
        slug: 'minimal-listing',
      };

      mockClient().fetch.mockResolvedValue(mockListing);

      const result = await getListingData('minimal-listing');

      expect(result).toEqual({
        ...mockListing,
        mapped: true,
      });
    });

    it('should use GROQ query with correct fields', async () => {
      mockClient().fetch.mockResolvedValue({ _id: 'test', name: 'Test', slug: 'test' });

      await getListingData('test-slug');

      const query = mockClient().fetch.mock.calls[0][0];

      expect(query).toContain('_id');
      expect(query).toContain('name');
      expect(query).toContain('slug');
      expect(query).toContain('city->');
      expect(query).toContain('ecoFocusTags');
      expect(query).toContain('amenities');
      expect(query).toContain('moderation');
    });
  });
});
