import type {
  CitiesApiResponse,
  CityDto,
  FeaturedListingDto,
  FeaturedListingsApiResponse,
} from '../api';

describe('api types', () => {
  describe('CityDto interface', () => {
    it('should accept valid city DTO', () => {
      const city: CityDto = {
        _id: 'city-123',
        name: 'Bangkok',
        slug: 'bangkok',
        country: 'Thailand',
        sustainabilityScore: 85,
        highlights: ['Public Transport', 'Green Spaces'],
        image: {
          asset: {
            _id: 'image-123',
            url: 'https://example.com/image.jpg',
          },
          hotspot: { x: 0.5, y: 0.5 },
          crop: { top: 0, bottom: 0, left: 0, right: 0 },
        },
      };
      expect(city._id).toBe('city-123');
      expect(city.name).toBe('Bangkok');
      expect(city.sustainabilityScore).toBe(85);
    });

    it('should accept city without optional fields', () => {
      const city: CityDto = {
        _id: 'city-456',
        name: 'Chiang Mai',
        slug: 'chiang-mai',
        country: 'Thailand',
        sustainabilityScore: 90,
        highlights: [],
        image: {
          asset: {
            _id: 'img',
            url: 'url',
          },
        },
      };
      expect(city.highlights).toHaveLength(0);
    });

    it('should handle different sustainability scores', () => {
      const lowScore: CityDto = {
        _id: '1',
        name: 'City 1',
        slug: 'city-1',
        country: 'Country',
        sustainabilityScore: 40,
        highlights: [],
        image: { asset: { _id: 'img', url: 'url' } },
      };

      const highScore: CityDto = {
        _id: '2',
        name: 'City 2',
        slug: 'city-2',
        country: 'Country',
        sustainabilityScore: 95,
        highlights: [],
        image: { asset: { _id: 'img', url: 'url' } },
      };

      expect(highScore.sustainabilityScore).toBeGreaterThan(lowScore.sustainabilityScore);
    });
  });

  describe('CitiesApiResponse interface', () => {
    it('should accept valid cities response', () => {
      const response: CitiesApiResponse = {
        cities: [
          {
            _id: 'city-1',
            name: 'Bangkok',
            slug: 'bangkok',
            country: 'Thailand',
            sustainabilityScore: 85,
            highlights: ['Transport'],
            image: { asset: { _id: 'img', url: 'url' } },
          },
        ],
        success: true,
        metadata: {
          total: 1,
          query_time: '50ms',
          performance: {
            totalTimeMs: '50',
            queryTimeMs: '45',
          },
        },
      };
      expect(response.success).toBe(true);
      expect(response.cities).toHaveLength(1);
      expect(response.metadata.total).toBe(1);
    });

    it('should handle empty cities array', () => {
      const response: CitiesApiResponse = {
        cities: [],
        success: true,
        metadata: {
          total: 0,
          query_time: '10ms',
          performance: {
            totalTimeMs: '10',
            queryTimeMs: '5',
          },
        },
      };
      expect(response.cities).toHaveLength(0);
      expect(response.metadata.total).toBe(0);
    });

    it('should handle failed response', () => {
      const response: CitiesApiResponse = {
        cities: [],
        success: false,
        metadata: {
          total: 0,
          query_time: '0ms',
          performance: {
            totalTimeMs: '0',
            queryTimeMs: '0',
          },
        },
      };
      expect(response.success).toBe(false);
    });
  });

  describe('FeaturedListingDto interface', () => {
    it('should accept minimal featured listing', () => {
      const listing: FeaturedListingDto = {
        _id: 'listing-123',
        name: 'Eco Coworking',
        slug: 'eco-coworking',
      };
      expect(listing._id).toBe('listing-123');
      expect(listing.name).toBe('Eco Coworking');
    });

    it('should accept listing with city', () => {
      const listing: FeaturedListingDto = {
        _id: 'listing-456',
        name: 'Green Cafe',
        slug: 'green-cafe',
        city: {
          _id: 'city-1',
          name: 'Bangkok',
          slug: 'bangkok',
          country: 'Thailand',
        },
      };
      expect(listing.city?.name).toBe('Bangkok');
      expect(listing.city?.country).toBe('Thailand');
    });

    it('should accept listing with eco focus tags', () => {
      const listing: FeaturedListingDto = {
        _id: 'listing-1',
        name: 'Sustainable Space',
        slug: 'sustainable-space',
        ecoFocusTags: ['solar-power', 'recycling', 'organic'],
      };
      expect(listing.ecoFocusTags).toHaveLength(3);
      expect(listing.ecoFocusTags).toContain('solar-power');
    });

    it('should accept listing with digital nomad features', () => {
      const listing: FeaturedListingDto = {
        _id: 'listing-2',
        name: 'Nomad Hub',
        slug: 'nomad-hub',
        digitalNomadFeatures: ['high-speed-wifi', 'meeting-rooms', 'quiet-spaces'],
      };
      expect(listing.digitalNomadFeatures).toHaveLength(3);
    });

    it('should accept listing with amenities', () => {
      const listing: FeaturedListingDto = {
        _id: 'listing-3',
        name: 'Full Service Space',
        slug: 'full-service',
        amenities: [
          {
            _id: 'amenity-1',
            name: 'WiFi',
            description: 'High-speed internet',
            badge: {
              asset: { _id: 'badge-img', url: 'https://example.com/badge.png' },
            },
          },
        ],
      };
      expect(listing.amenities).toHaveLength(1);
      expect(listing.amenities?.[0].name).toBe('WiFi');
    });

    it('should accept listing with contact information', () => {
      const listing: FeaturedListingDto = {
        _id: 'listing-4',
        name: 'Contact Space',
        slug: 'contact-space',
        contactPhone: '+66-123-4567',
        contactEmail: 'info@example.com',
        website: 'https://example.com',
      };
      expect(listing.contactPhone).toBe('+66-123-4567');
      expect(listing.contactEmail).toBe('info@example.com');
      expect(listing.website).toBe('https://example.com');
    });

    it('should accept listing with price and type', () => {
      const listing: FeaturedListingDto = {
        _id: 'listing-5',
        name: 'Budget Space',
        slug: 'budget-space',
        priceRange: 'budget',
        type: 'coworking',
        shortDescription: 'Affordable workspace',
      };
      expect(listing.priceRange).toBe('budget');
      expect(listing.type).toBe('coworking');
    });

    it('should accept listing with location', () => {
      const listing: FeaturedListingDto = {
        _id: 'listing-6',
        name: 'Located Space',
        slug: 'located-space',
        address: '123 Main St, Bangkok',
        category: 'coworking',
        location: { lat: 13.7563, lng: 100.5018 },
      };
      expect(listing.address).toBe('123 Main St, Bangkok');
      expect(listing.location?.lat).toBe(13.7563);
    });

    it('should accept listing with images', () => {
      const listing: FeaturedListingDto = {
        _id: 'listing-7',
        name: 'Image Space',
        slug: 'image-space',
        primaryImage: {
          asset: { _id: 'img-1', url: 'https://example.com/main.jpg' },
        },
        galleryImages: [
          { asset: { _id: 'img-2', url: 'https://example.com/gallery1.jpg' } },
          { asset: { _id: 'img-3', url: 'https://example.com/gallery2.jpg' } },
        ],
        imageUrl: 'https://example.com/main.jpg',
      };
      expect(listing.primaryImage?.asset.url).toBeDefined();
      expect(listing.galleryImages).toHaveLength(2);
    });

    it('should accept listing with coworking details', () => {
      const listing: FeaturedListingDto = {
        _id: 'listing-8',
        name: 'Coworking Details',
        slug: 'coworking-details',
        coworkingDetails: {
          capacity: 50,
          pricingPlans: [
            { type: 'daily', price: 300, period: 'day' },
            { type: 'monthly', price: 5000, period: 'month' },
          ],
          openingHours: [{ day: 'Monday', opens: '09:00', closes: '18:00' }],
        },
      };
      expect(listing.coworkingDetails?.capacity).toBe(50);
      expect(listing.coworkingDetails?.pricingPlans).toHaveLength(2);
    });

    it('should accept listing with accommodation details', () => {
      const listing: FeaturedListingDto = {
        _id: 'listing-9',
        name: 'Accommodation',
        slug: 'accommodation',
        accommodationDetails: {
          pricePerNightThb: { min: 500, max: 2000 },
          openingHours: [{ day: 'Monday', opens: '00:00', closes: '23:59' }],
        },
      };
      expect(listing.accommodationDetails?.pricePerNightThb?.min).toBe(500);
      expect(listing.accommodationDetails?.pricePerNightThb?.max).toBe(2000);
    });

    it('should accept listing with cafe details', () => {
      const listing: FeaturedListingDto = {
        _id: 'listing-10',
        name: 'Cafe',
        slug: 'cafe',
        cafeDetails: {
          openingHours: [{ day: 'Monday', opens: '07:00', closes: '19:00' }],
        },
      };
      expect(listing.cafeDetails?.openingHours).toHaveLength(1);
    });
  });

  describe('FeaturedListingsApiResponse interface', () => {
    it('should accept valid featured listings response', () => {
      const response: FeaturedListingsApiResponse = {
        listings: [
          {
            _id: 'listing-1',
            name: 'Featured Space',
            slug: 'featured-space',
          },
        ],
        success: true,
        metadata: {
          total: 1,
          queryTime: '30ms',
          performance: {
            totalTimeMs: '30',
            queryTimeMs: '25',
          },
        },
      };
      expect(response.success).toBe(true);
      expect(response.listings).toHaveLength(1);
    });

    it('should handle empty listings', () => {
      const response: FeaturedListingsApiResponse = {
        listings: [],
        success: true,
        metadata: {
          total: 0,
          queryTime: '10ms',
          performance: {
            totalTimeMs: '10',
            queryTimeMs: '5',
          },
        },
      };
      expect(response.listings).toHaveLength(0);
    });

    it('should track performance metrics', () => {
      const response: FeaturedListingsApiResponse = {
        listings: [],
        success: true,
        metadata: {
          total: 0,
          queryTime: '100ms',
          performance: {
            totalTimeMs: '100',
            queryTimeMs: '80',
          },
        },
      };
      expect(response.metadata.performance.totalTimeMs).toBe('100');
      expect(response.metadata.performance.queryTimeMs).toBe('80');
    });
  });

  describe('Integration scenarios', () => {
    it('should support complete API workflow', () => {
      const citiesResponse: CitiesApiResponse = {
        cities: [
          {
            _id: 'city-1',
            name: 'Bangkok',
            slug: 'bangkok',
            country: 'Thailand',
            sustainabilityScore: 85,
            highlights: ['Transport', 'Parks'],
            image: { asset: { _id: 'img', url: 'url' } },
          },
        ],
        success: true,
        metadata: {
          total: 1,
          query_time: '50ms',
          performance: {
            totalTimeMs: '50',
            queryTimeMs: '45',
          },
        },
      };

      const listingsResponse: FeaturedListingsApiResponse = {
        listings: [
          {
            _id: 'listing-1',
            name: 'Eco Space',
            slug: 'eco-space',
            city: {
              _id: citiesResponse.cities[0]._id,
              name: citiesResponse.cities[0].name,
              slug: citiesResponse.cities[0].slug,
              country: citiesResponse.cities[0].country,
            },
          },
        ],
        success: true,
        metadata: {
          total: 1,
          queryTime: '30ms',
          performance: {
            totalTimeMs: '30',
            queryTimeMs: '25',
          },
        },
      };

      expect(listingsResponse.listings[0].city?.name).toBe(citiesResponse.cities[0].name);
    });

    it('should handle error responses', () => {
      const errorResponse: CitiesApiResponse = {
        cities: [],
        success: false,
        metadata: {
          total: 0,
          query_time: '0ms',
          performance: {
            totalTimeMs: '0',
            queryTimeMs: '0',
          },
        },
      };

      if (!errorResponse.success) {
        expect(errorResponse.cities).toHaveLength(0);
      }
    });
  });
});
