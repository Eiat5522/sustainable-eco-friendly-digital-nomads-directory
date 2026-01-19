import type { CitiesApiResponse, CityDto, FeaturedListingsApiResponse } from '../api';
import type { FeaturedListingDTO } from '../dto';

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
            _id: 'image-456',
            url: 'https://example.com/image.jpg',
          },
        },
      };
      expect(city.country).toBe('Thailand');
    });
  });

  describe('FeaturedListingsApiResponse interface', () => {
    it('should accept valid featured listings response', () => {
      const response: FeaturedListingsApiResponse = {
        listings: [
          {
            id: 'listing-1',
            name: 'Featured Space',
            slug: 'featured-space',
            imageUrl: 'https://example.com/img.jpg',
            city: 'Bangkok',
          },
        ],
        success: true,
      };
      expect(response.success).toBe(true);
      expect(response.listings).toHaveLength(1);
    });

    it('should handle empty listings', () => {
      const response: FeaturedListingsApiResponse = {
        listings: [],
        success: true,
      };
      expect(response.listings).toHaveLength(0);
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
            id: 'listing-1',
            name: 'Eco Space',
            slug: 'eco-space',
            imageUrl: 'https://example.com/img.jpg',
            city: citiesResponse.cities[0].name,
          } satisfies FeaturedListingDTO,
        ],
        success: true,
      };

      expect(listingsResponse.listings[0].city).toBe(citiesResponse.cities[0].name);
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
