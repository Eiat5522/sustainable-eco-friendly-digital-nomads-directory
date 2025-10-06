import {
  GeoPointSchema,
  ImageDimensionsDTOSchema,
  CityDTOSchema,
  CityDetailDTOSchema,
  ListingStatusDTOSchema,
  VerificationStatusDTOSchema,
  BaseListingDTOSchema,
  ListingSummaryDTOSchema,
  ListingSummaryDTOArraySchema,
  parseCityDTO,
  parseCityDetailDTO,
  parseListingSummaryArray
} from '../dto-schemas';

describe('dto-schemas validation', () => {
  describe('GeoPointSchema', () => {
    it('should validate correct geo point', () => {
      const valid = { lat: 13.7563, lng: 100.5018 };
      const result = GeoPointSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject geo point with missing lat', () => {
      const invalid = { lng: 100.5018 };
      const result = GeoPointSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject geo point with string coordinates', () => {
      const invalid = { lat: '13.7563', lng: '100.5018' };
      const result = GeoPointSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject geo point with extra properties', () => {
      const invalid = { lat: 13.7563, lng: 100.5018, extra: 'field' };
      const result = GeoPointSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('ImageDimensionsDTOSchema', () => {
    it('should validate with width and height', () => {
      const valid = { width: 800, height: 600 };
      const result = ImageDimensionsDTOSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate with only width', () => {
      const valid = { width: 800 };
      const result = ImageDimensionsDTOSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate empty object', () => {
      const valid = {};
      const result = ImageDimensionsDTOSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject string dimensions', () => {
      const invalid = { width: '800', height: '600' };
      const result = ImageDimensionsDTOSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('CityDTOSchema', () => {
    it('should validate complete city DTO', () => {
      const valid = {
        id: 'city-123',
        name: 'Bangkok',
        slug: 'bangkok',
        country: 'Thailand',
        sustainabilityScore: 85,
        highlights: ['Transport', 'Parks'],
        imageUrl: 'https://example.com/image.jpg',
        imageDimensions: { width: 800, height: 600 },
        description: 'A vibrant city'
      };
      const result = CityDTOSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate minimal city DTO', () => {
      const valid = {
        id: 'city-456',
        name: 'Chiang Mai',
        slug: 'chiang-mai',
        country: 'Thailand'
      };
      const result = CityDTOSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject city with missing required fields', () => {
      const invalid = {
        id: 'city-789',
        name: 'Incomplete City'
      };
      const result = CityDTOSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject city with invalid sustainability score', () => {
      const invalid = {
        id: 'city-1',
        name: 'Test',
        slug: 'test',
        country: 'Test',
        sustainabilityScore: 150
      };
      const result = CityDTOSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should accept null imageUrl', () => {
      const valid = {
        id: 'city-2',
        name: 'Test',
        slug: 'test',
        country: 'Test',
        imageUrl: null
      };
      const result = CityDTOSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('CityDetailDTOSchema', () => {
    it('should validate complete city detail DTO', () => {
      const valid = {
        id: 'city-123',
        name: 'Bangkok',
        slug: 'bangkok',
        country: 'Thailand',
        shortDescription: 'Great city',
        airQuality: 'Good',
        internetSpeed: 100,
        costOfLiving: 'Moderate',
        climate: 'Tropical',
        safety: 'High',
        walkability: 'Good',
        sustainabilityInitiatives: ['Solar', 'Recycling'],
        digitalNomadFeatures: ['WiFi', 'Coworking'],
        galleryImages: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg']
      };
      const result = CityDetailDTOSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate internetSpeed as object', () => {
      const valid = {
        id: 'city-1',
        name: 'Test',
        slug: 'test',
        country: 'Test',
        internetSpeed: { download: 100, upload: 50, lastTested: '2024-01-15' }
      };
      const result = CityDetailDTOSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject invalid gallery image URLs', () => {
      const invalid = {
        id: 'city-1',
        name: 'Test',
        slug: 'test',
        country: 'Test',
        galleryImages: ['not-a-url', 'also-not-a-url']
      };
      const result = CityDetailDTOSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('ListingStatusDTOSchema', () => {
    it('should validate all status values', () => {
      const statuses = ['draft', 'pending', 'published', 'archived', 'flagged'];
      statuses.forEach(status => {
        const result = ListingStatusDTOSchema.safeParse(status);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid status', () => {
      const result = ListingStatusDTOSchema.safeParse('invalid');
      expect(result.success).toBe(false);
    });
  });

  describe('VerificationStatusDTOSchema', () => {
    it('should validate all verification statuses', () => {
      const statuses = ['unverified', 'verified', 'needs_verification'];
      statuses.forEach(status => {
        const result = VerificationStatusDTOSchema.safeParse(status);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid verification status', () => {
      const result = VerificationStatusDTOSchema.safeParse('invalid');
      expect(result.success).toBe(false);
    });
  });

  describe('BaseListingDTOSchema', () => {
    it('should validate complete base listing', () => {
      const valid = {
        id: 'listing-123',
        name: 'Eco Coworking',
        slug: 'eco-coworking',
        type: 'coworking',
        city: {
          id: 'city-1',
          name: 'Bangkok',
          slug: 'bangkok',
          country: 'Thailand'
        },
        imageUrl: 'https://example.com/image.jpg',
        ecoFocusTags: ['solar', 'recycling'],
        digitalNomadFeatures: ['wifi', 'meeting-rooms'],
        priceRange: 'moderate',
        website: 'https://example.com',
        address: '123 Main St',
        location: { lat: 13.7563, lng: 100.5018 },
        status: 'published',
        verification: 'verified',
        lastVerifiedAt: '2024-01-15',
        featured: true
      };
      const result = BaseListingDTOSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate minimal base listing', () => {
      const valid = {
        id: 'listing-456',
        name: 'Simple Cafe',
        slug: 'simple-cafe',
        type: 'cafe',
        city: null
      };
      const result = BaseListingDTOSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject invalid listing type', () => {
      const invalid = {
        id: 'listing-1',
        name: 'Test',
        slug: 'test',
        type: 'invalid-type',
        city: null
      };
      const result = BaseListingDTOSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject invalid website URL', () => {
      const invalid = {
        id: 'listing-1',
        name: 'Test',
        slug: 'test',
        type: 'coworking',
        city: null,
        website: 'not-a-url'
      };
      const result = BaseListingDTOSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should accept null priceRange', () => {
      const valid = {
        id: 'listing-1',
        name: 'Test',
        slug: 'test',
        type: 'coworking',
        city: null,
        priceRange: null
      };
      const result = BaseListingDTOSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('ListingSummaryDTOSchema', () => {
    it('should validate listing summary', () => {
      const valid = {
        id: 'listing-123',
        name: 'Summary Listing',
        slug: 'summary-listing',
        type: 'accommodation',
        city: null,
        shortDescription: 'A nice place',
        amenityNames: ['WiFi', 'Parking', 'Kitchen']
      };
      const result = ListingSummaryDTOSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should extend BaseListingDTOSchema', () => {
      const valid = {
        id: 'listing-456',
        name: 'Extended Summary',
        slug: 'extended-summary',
        type: 'restaurant',
        city: null,
        status: 'published',
        shortDescription: 'Great food'
      };
      const result = ListingSummaryDTOSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('ListingSummaryDTOArraySchema', () => {
    it('should validate array of listing summaries', () => {
      const valid = [
        {
          id: 'listing-1',
          name: 'Listing 1',
          slug: 'listing-1',
          type: 'coworking',
          city: null
        },
        {
          id: 'listing-2',
          name: 'Listing 2',
          slug: 'listing-2',
          type: 'cafe',
          city: null
        }
      ];
      const result = ListingSummaryDTOArraySchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate empty array', () => {
      const result = ListingSummaryDTOArraySchema.safeParse([]);
      expect(result.success).toBe(true);
    });

    it('should reject array with invalid items', () => {
      const invalid = [
        {
          id: 'listing-1',
          name: 'Valid',
          slug: 'valid',
          type: 'coworking',
          city: null
        },
        {
          id: 'listing-2',
          name: 'Invalid'
          // missing required fields
        }
      ];
      const result = ListingSummaryDTOArraySchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('parseCityDTO function', () => {
    it('should return ok result for valid city', () => {
      const input = {
        id: 'city-123',
        name: 'Bangkok',
        slug: 'bangkok',
        country: 'Thailand'
      };
      const result = parseCityDTO(input);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.name).toBe('Bangkok');
      }
    });

    it('should return error for invalid city', () => {
      const input = {
        id: 'city-123',
        name: 'Incomplete'
      };
      const result = parseCityDTO(input);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeDefined();
      }
    });

    it('should handle null input', () => {
      const result = parseCityDTO(null);
      expect(result.ok).toBe(false);
    });
  });

  describe('parseCityDetailDTO function', () => {
    it('should return ok result for valid city detail', () => {
      const input = {
        id: 'city-123',
        name: 'Bangkok',
        slug: 'bangkok',
        country: 'Thailand',
        shortDescription: 'Great city',
        internetSpeed: 100
      };
      const result = parseCityDetailDTO(input);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.shortDescription).toBe('Great city');
      }
    });

    it('should return error for invalid city detail', () => {
      const input = {
        id: 'city-123'
      };
      const result = parseCityDetailDTO(input);
      expect(result.ok).toBe(false);
    });
  });

  describe('parseListingSummaryArray function', () => {
    it('should return ok result for valid array', () => {
      const input = [
        {
          id: 'listing-1',
          name: 'Listing 1',
          slug: 'listing-1',
          type: 'coworking',
          city: null
        }
      ];
      const result = parseListingSummaryArray(input);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveLength(1);
      }
    });

    it('should return error for invalid array', () => {
      const input = [
        {
          id: 'listing-1',
          name: 'Invalid'
        }
      ];
      const result = parseListingSummaryArray(input);
      expect(result.ok).toBe(false);
    });

    it('should handle empty array', () => {
      const result = parseListingSummaryArray([]);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveLength(0);
      }
    });
  });

  describe('Integration validation scenarios', () => {
    it('should validate nested city in listing', () => {
      const listing = {
        id: 'listing-1',
        name: 'Test',
        slug: 'test',
        type: 'coworking',
        city: {
          id: 'city-1',
          name: 'Bangkok',
          slug: 'bangkok',
          country: 'Thailand',
          sustainabilityScore: 85
        }
      };
      const result = BaseListingDTOSchema.safeParse(listing);
      expect(result.success).toBe(true);
    });

    it('should validate complete workflow', () => {
      const cityInput = {
        id: 'city-1',
        name: 'Bangkok',
        slug: 'bangkok',
        country: 'Thailand'
      };
      
      const cityResult = parseCityDTO(cityInput);
      expect(cityResult.ok).toBe(true);
      
      if (cityResult.ok) {
        const listingInput = {
          id: 'listing-1',
          name: 'Test Listing',
          slug: 'test-listing',
          type: 'coworking',
          city: cityResult.data
        };
        
        const listingResult = BaseListingDTOSchema.safeParse(listingInput);
        expect(listingResult.success).toBe(true);
      }
    });

    it('should validate array parsing with filter', () => {
      const input = [
        {
          id: 'listing-1',
          name: 'Published',
          slug: 'published',
          type: 'coworking',
          city: null,
          status: 'published'
        },
        {
          id: 'listing-2',
          name: 'Draft',
          slug: 'draft',
          type: 'cafe',
          city: null,
          status: 'draft'
        }
      ];
      
      const result = parseListingSummaryArray(input);
      expect(result.ok).toBe(true);
      
      if (result.ok) {
        const published = result.data.filter(l => l.status === 'published');
        expect(published).toHaveLength(1);
      }
    });
  });
});
