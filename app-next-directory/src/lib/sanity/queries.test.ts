/**
 * Tests for queries.ts - Sanity query functions
 */

import {
  getAllCities,
  getAllEcoTags,
  getLatestBlogPosts,
  getListingBySlug,
  getFeaturedListings,
  getCity,
} from './queries';
import { client } from './client';

// Mock the client module
jest.mock('./client', () => ({
  client: {
    fetch: jest.fn(),
  },
}));

describe('queries.ts', () => {
  const mockClient = client as jest.Mocked<typeof client>;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getListingBySlug', () => {
    it('should fetch listing by slug', async () => {
      const mockListing = {
        _id: 'listing-123',
        name: 'Test Coworking',
        slug: 'test-coworking',
        city: {
          _id: 'city-456',
          name: 'Chiang Mai',
          slug: 'chiang-mai',
          country: 'Thailand',
        },
        ecoTags: ['Solar Power', 'Recycling'],
        nomadFeatures: ['High-Speed WiFi', 'Meeting Rooms'],
        contactPhone: '+66123456789',
        contactEmail: 'info@test.com',
        website: 'https://test.com',
        priceRange: '$$',
        shortDescription: 'A great coworking space',
        longDescription: 'A detailed description',
        coworkingDetails: {
          capacity: 50,
          pricingPlans: [{ type: 'day-pass', price: 200, period: 'day' }],
          openingHours: [{ day: 'Monday', opens: '08:00', closes: '18:00' }],
        },
        amenities: [],
      };

      mockClient.fetch.mockResolvedValue(mockListing);

      const result = await getListingBySlug('test-coworking');

      expect(mockClient.fetch).toHaveBeenCalledWith(
        expect.stringContaining('*[_type=="listing" && slug.current==$slug]'),
        { slug: 'test-coworking' }
      );
      expect(result).toEqual(mockListing);
    });

    it('should handle preview mode', async () => {
      mockClient.fetch.mockResolvedValue(null);

      await getListingBySlug('test-slug', true);

      expect(mockClient.fetch).toHaveBeenCalled();
    });

    it('should return null for non-existent listing', async () => {
      mockClient.fetch.mockResolvedValue(null);

      const result = await getListingBySlug('non-existent');

      expect(result).toBeNull();
    });

    it('should fetch accommodation details', async () => {
      const mockListing = {
        _id: 'listing-accommodation',
        name: 'Test Hotel',
        slug: 'test-hotel',
        accommodationDetails: {
          pricePerNightThb: { min: 500, max: 1500 },
          openingHours: [{ day: 'Monday', opens: '00:00', closes: '23:59' }],
        },
      };

      mockClient.fetch.mockResolvedValue(mockListing);

      const result = await getListingBySlug('test-hotel');

      expect(result).toMatchObject({
        accommodationDetails: {
          pricePerNightThb: { min: 500, max: 1500 },
        },
      });
    });

    it('should fetch cafe details', async () => {
      const mockListing = {
        _id: 'listing-cafe',
        name: 'Test Cafe',
        slug: 'test-cafe',
        cafeDetails: {
          openingHours: [{ day: 'Monday', opens: '07:00', closes: '20:00' }],
        },
      };

      mockClient.fetch.mockResolvedValue(mockListing);

      const result = await getListingBySlug('test-cafe');

      expect(result?.cafeDetails).toBeDefined();
    });
  });

  describe('getAllCities', () => {
    it('should fetch all cities', async () => {
      const mockCities = [
        {
          _id: 'city-1',
          title: 'Chiang Mai',
          slug: 'chiang-mai',
          country: 'Thailand',
          description: 'Digital nomad hub',
          sustainabilityScore: 85,
          highlights: ['Eco-friendly', 'Affordable'],
          primaryImage: {
            asset: {
              _ref: 'image-ref',
              _id: 'image-id',
              url: 'https://example.com/image.jpg',
              metadata: {
                dimensions: { width: 1200, height: 800 },
              },
            },
          },
        },
        {
          _id: 'city-2',
          title: 'Lisbon',
          slug: 'lisbon',
          country: 'Portugal',
          description: 'Beautiful coastal city',
          sustainabilityScore: 78,
          highlights: ['Great weather', 'Vibrant culture'],
          primaryImage: {
            asset: {
              _ref: 'image-ref-2',
              _id: 'image-id-2',
              url: 'https://example.com/image2.jpg',
              metadata: {
                dimensions: { width: 1200, height: 800 },
              },
            },
          },
        },
      ];

      mockClient.fetch.mockResolvedValue(mockCities);

      const result = await getAllCities();

      expect(mockClient.fetch).toHaveBeenCalledWith(
        expect.stringContaining('*[_type == "city"]')
      );
      expect(result).toEqual(mockCities);
      expect(result).toHaveLength(2);
    });

    it('should handle preview mode', async () => {
      mockClient.fetch.mockResolvedValue([]);

      await getAllCities(true);

      expect(mockClient.fetch).toHaveBeenCalled();
    });

    it('should return empty array when no cities exist', async () => {
      mockClient.fetch.mockResolvedValue([]);

      const result = await getAllCities();

      expect(result).toEqual([]);
    });
  });

  describe('getAllEcoTags', () => {
    it('should fetch all eco tags', async () => {
      const mockTags = [
        {
          _id: 'tag-1',
          name: 'Solar Power',
          slug: 'solar-power',
          description: 'Uses solar panels',
        },
        {
          _id: 'tag-2',
          name: 'Recycling',
          slug: 'recycling',
          description: 'Active recycling program',
        },
      ];

      mockClient.fetch.mockResolvedValue(mockTags);

      const result = await getAllEcoTags();

      expect(mockClient.fetch).toHaveBeenCalledWith(
        expect.stringContaining('*[_type == "ecoTag"]')
      );
      expect(result).toEqual(mockTags);
      expect(result).toHaveLength(2);
    });

    it('should handle preview mode', async () => {
      mockClient.fetch.mockResolvedValue([]);

      await getAllEcoTags(true);

      expect(mockClient.fetch).toHaveBeenCalled();
    });

    it('should return empty array when no tags exist', async () => {
      mockClient.fetch.mockResolvedValue([]);

      const result = await getAllEcoTags();

      expect(result).toEqual([]);
    });
  });

  describe('getLatestBlogPosts', () => {
    it('should fetch latest blog posts with default limit', async () => {
      const mockPosts = [
        {
          _id: 'post-1',
          title: 'First Post',
          slug: 'first-post',
          excerpt: 'This is the first post',
          primaryImage: { asset: { _ref: 'image-ref' } },
          _createdAt: '2024-01-01T00:00:00Z',
          author: 'John Doe',
        },
        {
          _id: 'post-2',
          title: 'Second Post',
          slug: 'second-post',
          excerpt: 'This is the second post',
          primaryImage: { asset: { _ref: 'image-ref-2' } },
          _createdAt: '2024-01-02T00:00:00Z',
          author: 'Jane Smith',
        },
      ];

      mockClient.fetch.mockResolvedValue(mockPosts);

      const result = await getLatestBlogPosts();

      expect(mockClient.fetch).toHaveBeenCalledWith(
        expect.stringContaining('*[_type == "blogPost"]'),
        { limit: 2 } // limit - 1 due to the implementation
      );
      expect(result).toEqual(mockPosts);
    });

    it('should fetch blog posts with custom limit', async () => {
      mockClient.fetch.mockResolvedValue([]);

      await getLatestBlogPosts(5);

      expect(mockClient.fetch).toHaveBeenCalledWith(
        expect.anything(),
        { limit: 4 } // 5 - 1
      );
    });

    it('should handle preview mode', async () => {
      mockClient.fetch.mockResolvedValue([]);

      await getLatestBlogPosts(3, true);

      expect(mockClient.fetch).toHaveBeenCalled();
    });

    it('should order posts by creation date descending', async () => {
      mockClient.fetch.mockResolvedValue([]);

      await getLatestBlogPosts();

      const query = mockClient.fetch.mock.calls[0][0];
      expect(query).toContain('order(_createdAt desc)');
    });

    it('should return empty array when no posts exist', async () => {
      mockClient.fetch.mockResolvedValue([]);

      const result = await getLatestBlogPosts();

      expect(result).toEqual([]);
    });
  });

  describe('getFeaturedListings', () => {
    it('should fetch featured listings with default limit', async () => {
      const mockListings = [
        {
          _id: 'listing-1',
          name: 'Featured Listing 1',
          slug: 'featured-1',
          primaryImage: { asset: { url: 'https://example.com/1.jpg' } },
          galleryImages: [{ asset: { url: 'https://example.com/1-gallery.jpg' } }],
          location: { lat: 0, lng: 0 },
          city: { _id: 'city-1', name: 'Chiang Mai', country: 'Thailand' },
          priceRange: '$$',
        },
      ];

      mockClient.fetch.mockResolvedValue(mockListings);

      const result = await getFeaturedListings();

      expect(mockClient.fetch).toHaveBeenCalledWith(
        expect.stringContaining('moderation.featured == true'),
        { limit: 10 }
      );
      expect(result).toEqual(mockListings);
    });

    it('should fetch featured listings with custom limit', async () => {
      mockClient.fetch.mockResolvedValue([]);

      await getFeaturedListings(5);

      expect(mockClient.fetch).toHaveBeenCalledWith(
        expect.anything(),
        { limit: 5 }
      );
    });

    it('should only fetch published listings', async () => {
      mockClient.fetch.mockResolvedValue([]);

      await getFeaturedListings();

      const query = mockClient.fetch.mock.calls[0][0];
      expect(query).toContain('moderation.status == "published"');
    });

    it('should handle preview mode', async () => {
      mockClient.fetch.mockResolvedValue([]);

      await getFeaturedListings(10, true);

      expect(mockClient.fetch).toHaveBeenCalled();
    });

    it('should order listings by creation date descending', async () => {
      mockClient.fetch.mockResolvedValue([]);

      await getFeaturedListings();

      const query = mockClient.fetch.mock.calls[0][0];
      expect(query).toContain('order(_createdAt desc)');
    });

    it('should include gallery images and city details', async () => {
      const mockListings = [
        {
          _id: 'listing-full',
          name: 'Full Featured Listing',
          slug: 'full-featured',
          primaryImage: { asset: { url: 'https://example.com/primary.jpg' } },
          galleryImages: [
            { asset: { url: 'https://example.com/gallery1.jpg' } },
            { asset: { url: 'https://example.com/gallery2.jpg' } },
          ],
          location: { lat: 18.7883, lng: 98.9853 },
          city: {
            _id: 'city-cm',
            name: 'Chiang Mai',
            country: 'Thailand',
          },
          priceRange: '$$$',
        },
      ];

      mockClient.fetch.mockResolvedValue(mockListings);

      const result = await getFeaturedListings();

      expect(result[0]).toMatchObject({
        galleryImages: expect.arrayContaining([expect.objectContaining({ asset: expect.any(Object) })]),
        city: expect.objectContaining({ name: 'Chiang Mai', country: 'Thailand' }),
      });
    });

    it('should return empty array when no featured listings exist', async () => {
      mockClient.fetch.mockResolvedValue([]);

      const result = await getFeaturedListings();

      expect(result).toEqual([]);
    });
  });

  describe('getCity', () => {
    it('should be an alias for getListingBySlug', () => {
      expect(getCity).toBe(getListingBySlug);
    });

    it('should work as getListingBySlug', async () => {
      const mockListing = {
        _id: 'listing-123',
        name: 'Test',
        slug: 'test',
      };

      mockClient.fetch.mockResolvedValue(mockListing);

      const result = await getCity('test');

      expect(mockClient.fetch).toHaveBeenCalled();
      expect(result).toEqual(mockListing);
    });
  });
});
