import type {
  AccommodationDetails,
  ActivityDetails,
  AmenityDTO,
  BaseListingDTO,
  CafeDetails,
  CityDetailDTO,
  CityDTO,
  CoworkingDetails,
  FeaturedListingDTO,
  GeoPoint,
  ImageDimensionsDTO,
  InternetSpeedDTO,
  ISODateString,
  ListingDetailDTO,
  ListingSummaryDTO,
  Money,
  OpeningHour,
  RestaurantDetails,
} from '../dto';
import { asISODateString, assertISODateString, isISODateString } from '../dto';

describe('dto types', () => {
  describe('ImageDimensionsDTO', () => {
    it('should accept dimensions with width and height', () => {
      const dims: ImageDimensionsDTO = {
        width: 800,
        height: 600,
      };
      expect(dims.width).toBe(800);
      expect(dims.height).toBe(600);
    });

    it('should accept partial dimensions', () => {
      const dims1: ImageDimensionsDTO = { width: 800 };
      const dims2: ImageDimensionsDTO = { height: 600 };
      expect(dims1.width).toBe(800);
      expect(dims2.height).toBe(600);
    });
  });

  describe('CityDTO', () => {
    it('should accept complete city DTO', () => {
      const city: CityDTO = {
        id: 'city-123',
        name: 'Bangkok',
        slug: 'bangkok',
        country: 'Thailand',
        sustainabilityScore: 85 as any,
        highlights: ['Transport', 'Parks'],
        imageUrl: 'https://example.com/bangkok.jpg',
        imageDimensions: { width: 1200, height: 800 },
        description: 'Vibrant capital city',
      };
      expect(city.name).toBe('Bangkok');
      expect(city.sustainabilityScore).toBe(85);
    });
  });

  describe('CityDetailDTO', () => {
    it('should extend CityDTO with additional fields', () => {
      const detail: CityDetailDTO = {
        id: 'city-1',
        name: 'Chiang Mai',
        slug: 'chiang-mai',
        country: 'Thailand',
        shortDescription: 'Mountain city',
        airQuality: 'Good',
        internetSpeed: 100,
        costOfLiving: 'Low',
        climate: 'Tropical',
        safety: 'High',
        walkability: 'Good',
        sustainabilityInitiatives: ['Solar', 'Recycling'],
        digitalNomadFeatures: ['Coworking', 'Cafes'],
        galleryImages: ['https://example.com/img1.jpg'],
      };
      expect(detail.shortDescription).toBe('Mountain city');
      expect(detail.internetSpeed).toBe(100);
    });

    it('should accept internetSpeed as InternetSpeedDTO', () => {
      const detail: CityDetailDTO = {
        id: 'city-1',
        name: 'Test',
        slug: 'test',
        country: 'Test',
        internetSpeed: { download: 100, upload: 50 },
      };
      expect(typeof detail.internetSpeed).toBe('object');
    });
  });

  describe('AmenityDTO', () => {
    it('should accept complete amenity', () => {
      const amenity: AmenityDTO = {
        id: 'amenity-1',
        name: 'WiFi',
        slug: 'wifi',
        icon: 'wifi-icon',
        category: 'Technology',
      };
      expect(amenity.name).toBe('WiFi');
    });
  });

  describe('GeoPoint type', () => {
    it('should be readonly', () => {
      const point: GeoPoint = { lat: 13.7563, lng: 100.5018 };
      expect(point.lat).toBe(13.7563);
      expect(point.lng).toBe(100.5018);
    });
  });

  describe('InternetSpeedDTO type', () => {
    it('should accept download and upload speeds', () => {
      const speed: InternetSpeedDTO = {
        download: 100,
        upload: 50,
      };
      expect(speed.download).toBe(100);
      expect(speed.upload).toBe(50);
    });

    it('should accept optional lastTested', () => {
      const speed: InternetSpeedDTO = {
        download: 200,
        upload: 100,
        lastTested: '2024-01-15',
      };
      expect(speed.lastTested).toBe('2024-01-15');
    });
  });

  describe('Money type', () => {
    it('should accept amount and currency', () => {
      const money: Money = {
        amount: 5000,
        currency: 'THB',
      };
      expect(money.amount).toBe(5000);
      expect(money.currency).toBe('THB');
    });

    it('should accept optional unit', () => {
      const money: Money = {
        amount: 300,
        currency: 'THB',
        unit: 'night',
      };
      expect(money.unit).toBe('night');
    });
  });

  describe('OpeningHour type', () => {
    it('should accept day and hours', () => {
      const hours: OpeningHour = {
        day: 'Monday',
        opens: '09:00',
        closes: '18:00',
      };
      expect(hours.day).toBe('Monday');
    });
  });

  describe('BaseListingDTO', () => {
    it('should accept complete base listing', () => {
      const listing: BaseListingDTO = {
        id: 'listing-123',
        name: 'Eco Workspace',
        slug: 'eco-workspace',
        type: 'coworking',
        city: {
          id: 'city-1',
          name: 'Bangkok',
          slug: 'bangkok',
          country: 'Thailand',
        },
        imageUrl: 'https://example.com/image.jpg',
        ecoFocusTags: ['solar', 'recycling'],
        digitalNomadFeatures: ['wifi', 'desk'],
        priceRange: 'moderate',
        website: 'https://example.com',
        address: '123 Main St',
        location: { lat: 13.7563, lng: 100.5018 },
        status: 'published',
        verification: 'verified',
        lastVerifiedAt: '2024-01-15',
        featured: true,
      };
      expect(listing.type).toBe('coworking');
      expect(listing.status).toBe('published');
    });

    it('should accept null city', () => {
      const listing: BaseListingDTO = {
        id: 'listing-1',
        name: 'Test',
        slug: 'test',
        type: 'cafe',
        city: null,
      };
      expect(listing.city).toBeNull();
    });
  });

  describe('ListingSummaryDTO', () => {
    it('should extend BaseListingDTO', () => {
      const summary: ListingSummaryDTO = {
        id: 'listing-1',
        name: 'Summary Listing',
        slug: 'summary',
        type: 'accommodation',
        city: null,
        shortDescription: 'A nice place',
        amenityNames: ['WiFi', 'Parking'],
      };
      expect(summary.shortDescription).toBe('A nice place');
      expect(summary.amenityNames).toContain('WiFi');
    });
  });

  describe('FeaturedListingDTO', () => {
    it('should have minimal required fields', () => {
      const featured: FeaturedListingDTO = {
        id: 'listing-1',
        name: 'Featured Space',
        slug: 'featured-space',
        imageUrl: 'https://example.com/img.jpg',
        city: 'Bangkok',
      };
      expect(featured.city).toBe('Bangkok');
    });
  });

  describe('Detail type interfaces', () => {
    it('should accept CoworkingDetails', () => {
      const details: CoworkingDetails = {
        pricingPlans: [
          {
            type: 'daily',
            price: { amount: 300, currency: 'THB' },
            period: 'day',
            features: ['WiFi', 'Coffee'],
          },
        ],
        openingHours: [{ day: 'Monday', opens: '09:00', closes: '18:00' }],
        internetSpeed: { download: 100, upload: 50 },
      };
      expect(details.pricingPlans).toHaveLength(1);
    });

    it('should accept CafeDetails', () => {
      const details: CafeDetails = {
        openingHours: [{ day: 'Monday', opens: '07:00', closes: '19:00' }],
        priceIndication: '$-$$',
        menuHighlights: ['Organic coffee', 'Pastries'],
        noiseLevel: 'moderate',
        workPolicy: { laptopsAllowed: true, timeLimit: 4 },
      };
      expect(details.menuHighlights).toContain('Organic coffee');
    });

    it('should accept RestaurantDetails', () => {
      const details: RestaurantDetails = {
        cuisineType: ['Thai', 'Fusion'],
        operatingHours: [{ day: 'Monday', opens: '11:00', closes: '22:00' }],
        dietaryOptions: ['Vegetarian', 'Vegan'],
        averageMealPrice: { amount: 250, currency: 'THB', unit: 'meal' },
      };
      expect(details.cuisineType).toContain('Thai');
    });

    it('should accept ActivityDetails', () => {
      const details: ActivityDetails = {
        activityType: 'Hiking',
        duration: '3 hours',
        skillLevel: 'beginner',
        languages: ['English', 'Thai'],
      };
      expect(details.activityType).toBe('Hiking');
    });

    it('should accept AccommodationDetails', () => {
      const details: AccommodationDetails = {
        accommodationType: 'Hotel',
        pricePerNight: { amount: 1500, currency: 'THB', unit: 'night' },
        roomTypes: ['Single', 'Double'],
        minimumStay: 2,
      };
      expect(details.roomTypes).toContain('Single');
    });
  });

  describe('ListingDetailDTO discriminated union', () => {
    it('should accept coworking listing detail', () => {
      const detail: ListingDetailDTO = {
        id: 'listing-1',
        name: 'Coworking Space',
        slug: 'coworking',
        type: 'coworking',
        city: null,
        shortDescription: 'Great workspace',
        galleryImages: ['https://example.com/img1.jpg'],
        amenities: [{ id: 'am-1', name: 'WiFi', slug: 'wifi' }],
        coworkingDetails: {
          pricingPlans: [
            {
              type: 'monthly',
              price: { amount: 5000, currency: 'THB' },
              period: 'month',
            },
          ],
        },
      };
      expect(detail.type).toBe('coworking');
      expect(detail.coworkingDetails).toBeDefined();
    });

    it('should accept cafe listing detail', () => {
      const detail: ListingDetailDTO = {
        id: 'listing-2',
        name: 'Cafe',
        slug: 'cafe',
        type: 'cafe',
        city: null,
        galleryImages: [],
        amenities: [],
        cafeDetails: {
          menuHighlights: ['Coffee', 'Pastries'],
        },
      };
      expect(detail.type).toBe('cafe');
      expect(detail.cafeDetails).toBeDefined();
    });

    it('should accept restaurant listing detail', () => {
      const detail: ListingDetailDTO = {
        id: 'listing-3',
        name: 'Restaurant',
        slug: 'restaurant',
        type: 'restaurant',
        city: null,
        galleryImages: [],
        amenities: [],
        restaurantDetails: {
          cuisineType: ['Thai'],
        },
      };
      expect(detail.type).toBe('restaurant');
      expect(detail.restaurantDetails).toBeDefined();
    });

    it('should accept activities listing detail', () => {
      const detail: ListingDetailDTO = {
        id: 'listing-4',
        name: 'Activity',
        slug: 'activity',
        type: 'activities',
        city: null,
        galleryImages: [],
        amenities: [],
        activityDetails: {
          activityType: 'Tour',
        },
      };
      expect(detail.type).toBe('activities');
      expect(detail.activityDetails).toBeDefined();
    });

    it('should accept accommodation listing detail', () => {
      const detail: ListingDetailDTO = {
        id: 'listing-5',
        name: 'Hotel',
        slug: 'hotel',
        type: 'accommodation',
        city: null,
        galleryImages: [],
        amenities: [],
        accommodationDetails: {
          accommodationType: 'Hotel',
        },
      };
      expect(detail.type).toBe('accommodation');
      expect(detail.accommodationDetails).toBeDefined();
    });
  });

  describe('Type safety and discrimination', () => {
    it('should support type narrowing', () => {
      const listing: ListingDetailDTO = {
        id: 'listing-1',
        name: 'Test',
        slug: 'test',
        type: 'coworking',
        city: null,
        galleryImages: [],
        amenities: [],
        coworkingDetails: { pricingPlans: [] },
      };

      if (listing.type === 'coworking') {
        expect(listing.coworkingDetails).toBeDefined();
      }
    });

    it('should ensure mutual exclusivity of detail types', () => {
      const listing: ListingDetailDTO = {
        id: 'listing-1',
        name: 'Cafe',
        slug: 'cafe',
        type: 'cafe',
        city: null,
        galleryImages: [],
        amenities: [],
        cafeDetails: {},
      };

      if (listing.type === 'cafe') {
        expect(listing.cafeDetails).toBeDefined();
      }
    });
  });

  describe('ISO date helpers', () => {
    it('validates multiple ISO 8601 formats', () => {
      const dateOnly = '2024-01-31';
      const dateTimeZulu = '2024-01-31T15:45:30Z';
      const dateTimeOffset = '2024-01-31T15:45:30+07:00';

      expect(isISODateString(dateOnly)).toBe(true);
      expect(isISODateString(dateTimeZulu)).toBe(true);
      expect(isISODateString(dateTimeOffset)).toBe(true);
    });

    it('treats space separated date times as valid ISO values', () => {
      expect(isISODateString('2024-01-31 15:45:30')).toBe(true);
      expect(isISODateString('2024-01-31 15:45:30.123')).toBe(true);
    });

    it('rejects non ISO formatted values', () => {
      expect(isISODateString('31-01-2024')).toBe(false);
      expect(isISODateString('2024/01/31')).toBe(false);
    });

    it('asserts when value is not ISO 8601 compliant', () => {
      expect(() => assertISODateString('not-a-date')).toThrow(TypeError);
      expect(() => assertISODateString('2024-13-01T00:00:00')).not.toThrow();
    });

    it('surfaces a descriptive error message when assertion fails', () => {
      expect(() => assertISODateString('invalid!')).toThrow(
        new TypeError('Invalid ISO 8601 date/time string')
      );
    });

    it('brands values using asISODateString', () => {
      const branded: ISODateString = asISODateString('2024-01-31T00:00:00Z');
      expect(branded).toBe('2024-01-31T00:00:00Z');
    });
  });
});
