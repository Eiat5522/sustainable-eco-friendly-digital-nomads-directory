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
  let mockedFetch: jest.Mock;
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockedFetch = client.fetch as jest.Mock;
    process.env = {
      ...ORIGINAL_ENV,
      NEXT_PUBLIC_SANITY_PROJECT_ID: 'test-project',
      NEXT_PUBLIC_SANITY_DATASET: 'production',
    };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
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
      mockedFetch.mockResolvedValueOnce(mockListings);

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
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no featured listings exist', async () => {
      mockedFetch.mockResolvedValueOnce([]);

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
      mockedFetch.mockResolvedValueOnce(mockListings);

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
      mockedFetch.mockResolvedValueOnce([]);

      await GET();

      const query = mockedFetch.mock.calls[0][0];
      expect(query).toContain('_type == "listing"');
      expect(query).toContain('moderation.featured == true');
      expect(query).toContain('moderation.status == "published"');
      expect(query).toContain('order(_createdAt desc)');
      expect(query).toContain('[0...10]'); // Limit to 10 listings
    });

    it('should include all required listing fields in query', async () => {
      mockedFetch.mockResolvedValueOnce([]);

      await GET();

      const query = mockedFetch.mock.calls[0][0];
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
    it('should return empty listings on database fetch failure', async () => {
      mockedFetch.mockRejectedValueOnce(new Error('Sanity fetch error'));

      const response = await GET();
      const data = await response.json();

      // During prerendering, errors are caught and return empty listings with 200
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.listings).toEqual([]);
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    it('should return empty listings on network timeout errors', async () => {
      mockedFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const response = await GET();
      const data = await response.json();

      // During prerendering, errors are caught and return empty listings with 200
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.listings).toEqual([]);
    });

    it('should return mock featured venues when project ID is missing', async () => {
      delete process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.listings).toEqual(mockFeaturedVenues);
      expect(mockedFetch).not.toHaveBeenCalled();
    });

    it('should return mock featured venues when dataset is missing', async () => {
      delete process.env.NEXT_PUBLIC_SANITY_DATASET;

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.listings).toEqual(mockFeaturedVenues);
      expect(mockedFetch).not.toHaveBeenCalled();
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
      mockedFetch.mockResolvedValueOnce(mockListings);

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
      mockedFetch.mockResolvedValueOnce(mockListings);

      const response = await GET();
      const data = await response.json();

      expect(data.data.listings[0].ecoFocusTags).toEqual(['Solar', 'Wind Power']);
    });
  });
});
