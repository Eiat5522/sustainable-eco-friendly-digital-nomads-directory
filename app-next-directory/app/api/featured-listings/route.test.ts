/**
 * Jest Test Suite for Featured Listings API Route
 * Tests covering:
 * 1. GET /api/featured-listings - Fetch featured listings from Sanity
 * 2. Error handling for fetch failures
 * 3. DTO transformation
 * 4. Environment validation
 */

import { jest } from '@jest/globals';
import { mockFeaturedVenues } from '@/components/sections/featuredVenuesMockData';
import { client } from '@/lib/sanity/client';
import { GET } from './route';

// Mock Sanity client
jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: jest.fn(),
  },
}));

describe('Featured Listings API - GET /api/featured-listings', () => {
  let mockedSanityFetch: jest.Mock; // Renamed for clarity
  const ORIGINAL_ENV = { ...process.env }; // Capture original env once

  beforeEach(() => {
    jest.resetAllMocks(); // Resets all mocks, including module mocks
    mockedSanityFetch = jest.mocked(client).fetch; // Correctly get the mocked function
    process.env = {
      ...ORIGINAL_ENV, // Restore original env and then apply test-specific ones
      NEXT_PUBLIC_SANITY_PROJECT_ID: 'test-project',
      NEXT_PUBLIC_SANITY_DATASET: 'production',
    };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }; // Restore original process.env
  });

  describe('Successful Requests', () => {
    it('should return featured listings with transformed DTO', async () => {
      const mockListings = [
        {
          _id: '1',
          name: 'Green Coworking Space',
          slug: 'green-coworking',
          city: { _id: 'city1', name: 'Bangkok', slug: 'bangkok', country: 'Thailand' },
          ecoFocusTags: ['Solar Powered', 'Zero Waste'],
          digitalNomadFeatures: ['High-Speed WiFi', 'Meeting Rooms'],
          amenities: [{ _id: 'am1', name: 'Air Conditioning', description: 'Climate control' }],
          imageUrl: 'https://example.com/image.jpg',
          primaryImage: {
            asset: { _id: 'img1', url: 'https://example.com/image.jpg' },
          },
        },
      ];
      mockedSanityFetch.mockResolvedValueOnce(mockListings);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.listings).toBeDefined();
      expect(data.data.listings.length).toBe(1);
      expect(data.data.listings[0]).toEqual({
        id: '1',
        name: 'Green Coworking Space',
        slug: 'green-coworking',
        imageUrl: 'https://example.com/image.jpg',
        city: 'Bangkok',
        amenityNames: ['Air Conditioning'],
        ecoFocusTags: ['Solar Powered', 'Zero Waste'],
        featured: true,
      });
      expect(mockedSanityFetch).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no featured listings exist', async () => {
      mockedSanityFetch.mockResolvedValueOnce([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.listings).toEqual([]);
    });

    it('should handle listings without optional fields', async () => {
      const mockListings = [
        {
          _id: '2',
          name: 'Basic Listing',
          slug: 'basic-listing',
          imageUrl: null,
        },
      ];
      mockedSanityFetch.mockResolvedValueOnce(mockListings);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.listings[0]).toEqual({
        id: '2',
        name: 'Basic Listing',
        slug: 'basic-listing',
        imageUrl: undefined,
        city: '',
        amenityNames: [],
        ecoFocusTags: [],
        featured: true,
      });
    });

    it('should use correct GROQ query for featured listings', async () => {
      mockedSanityFetch.mockResolvedValueOnce([]);

      await GET();

      const query = mockedSanityFetch.mock.calls[0][0];
      expect(query).toContain('_type == "listing"');
      expect(query).toContain('moderation.featured == true');
      expect(query).toContain('moderation.status == "published"');
      expect(query).toContain('order(_createdAt desc)');
      expect(query).toContain('[0...10]'); // Limit to 10 listings
    });

    it('should include all required listing fields in query', async () => {
      mockedSanityFetch.mockResolvedValueOnce([]);

      await GET();

      const query = mockedSanityFetch.mock.calls[0][0];
      expect(query).toContain('_id');
      expect(query).toContain('name');
      expect(query).toContain('slug');
      expect(query).toContain('city');
      expect(query).toContain('ecoFocusTags');
      expect(query).toContain('digitalNomadFeatures');
      expect(query).toContain('amenities');
      expect(query).toContain('primaryImage');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database fetch failure', async () => {
      mockedSanityFetch.mockRejectedValueOnce(new Error('Sanity fetch error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch listings');
      // Error details are nested in data.data
      if (data.data?.details) {
        expect(data.data.details).toBe('Sanity fetch error');
      }
      expect(mockedSanityFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle network timeout errors', async () => {
      mockedSanityFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch listings');
      // Error details are nested in data.data
      if (data.data?.details) {
        expect(data.data.details).toBe('Network timeout');
      }
    });

    it('should return mock featured venues when project ID is missing', async () => {
      delete process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.listings).toEqual(mockFeaturedVenues);
      expect(mockedSanityFetch).not.toHaveBeenCalled();
    });

    it('should return mock featured venues when dataset is missing', async () => {
      delete process.env.NEXT_PUBLIC_SANITY_DATASET;

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.listings).toEqual(mockFeaturedVenues);
      expect(mockedSanityFetch).not.toHaveBeenCalled();
    });
  });

  describe('DTO Transformation', () => {
    it('should filter out invalid amenity names', async () => {
      const mockListings = [
        {
          _id: '3',
          name: 'Test Listing',
          slug: 'test-listing',
          amenities: [
            { _id: 'am1', name: 'Valid Amenity' },
            { _id: 'am2', name: '' },
            { _id: 'am3', name: null },
            { _id: 'am4', name: 'Another Valid' },
          ],
        },
      ];
      mockedSanityFetch.mockResolvedValueOnce(mockListings);

      const response = await GET();
      const data = await response.json();

      expect(data.data.listings[0].amenityNames).toEqual(['Valid Amenity', 'Another Valid']);
    });

    it('should filter out invalid eco focus tags', async () => {
      const mockListings = [
        {
          _id: '4',
          name: 'Test Listing',
          slug: 'test-listing',
          ecoFocusTags: ['Solar', '', null, 'Wind Power', undefined],
        },
      ];
      mockedSanityFetch.mockResolvedValueOnce(mockListings);

      const response = await GET();
      const data = await response.json();

      expect(data.data.listings[0].ecoFocusTags).toEqual(['Solar', 'Wind Power']);
    });
  });
});
