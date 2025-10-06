// NOTE: This file tests deprecated types. Use appView.ts or sanity.types.ts for new code.

import type {
  ListingType,
  PriceRangeType,
  LocalCity,
  EcoTag,
  Listing,
  CoworkingListing,
  CafeListing,
  AccommodationListing,
  RestaurantListing,
  ActivitiesListing
} from '../listing';
import { ListingCategory, PriceRange } from '../enums';

describe('listing types (deprecated)', () => {
  describe('Type aliases', () => {
    it('should support ListingType alias', () => {
      const type: ListingType = ListingCategory.COWORKING;
      expect(type).toBe('coworking');
    });

    it('should support PriceRangeType alias', () => {
      const priceRange: PriceRangeType = PriceRange.MODERATE;
      expect(priceRange).toBe('moderate');
    });
  });

  describe('LocalCity interface', () => {
    it('should accept city with string slug', () => {
      const city: LocalCity = {
        _id: 'city-123',
        name: 'Bangkok',
        slug: 'bangkok',
        listingCount: 50,
        country: 'Thailand'
      };
      expect(city.slug).toBe('bangkok');
    });

    it('should accept city with object slug', () => {
      const city: LocalCity = {
        _id: 'city-456',
        name: 'Chiang Mai',
        slug: { current: 'chiang-mai' },
        listingCount: 30,
        country: 'Thailand'
      };
      expect(typeof city.slug).toBe('object');
    });
  });

  describe('EcoTag interface', () => {
    it('should accept complete eco tag', () => {
      const tag: EcoTag = {
        _id: 'tag-123',
        name: 'Solar Power',
        slug: { current: 'solar-power' },
        description: 'Uses solar energy',
        listingCount: 25,
        icon: 'solar-icon'
      };
      expect(tag.name).toBe('Solar Power');
      expect(tag.listingCount).toBe(25);
    });

    it('should accept tag without icon', () => {
      const tag: EcoTag = {
        _id: 'tag-456',
        name: 'Recycling',
        slug: { current: 'recycling' },
        description: 'Has recycling program',
        listingCount: 40
      };
      expect(tag.icon).toBeUndefined();
    });
  });

  describe('Base Listing interface', () => {
    it('should accept minimal listing', () => {
      const listing: Listing = {
        _id: 'listing-123',
        name: 'Test Listing',
        slug: { current: 'test-listing' },
        type: ListingCategory.COWORKING,
        city: {
          _id: 'city-1',
          name: 'Bangkok',
          slug: { current: 'bangkok' },
          listingCount: 50,
          country: 'Thailand'
        },
        ecoTags: [],
        address: '123 Main St'
      };
      expect(listing._id).toBe('listing-123');
      expect(listing.type).toBe('coworking');
    });

    it('should accept listing with location', () => {
      const listing: Listing = {
        _id: 'listing-1',
        name: 'Located Venue',
        slug: { current: 'located-venue' },
        type: ListingCategory.CAFE,
        city: {
          _id: 'city-1',
          name: 'Bangkok',
          slug: 'bangkok',
          listingCount: 50,
          country: 'Thailand'
        },
        ecoTags: [],
        address: 'Address',
        location: {
          lat: 13.7563,
          lng: 100.5018,
          coordinates: [100.5018, 13.7563]
        }
      };
      expect(listing.location?.lat).toBe(13.7563);
    });

    it('should accept listing with images', () => {
      const listing: Listing = {
        _id: 'listing-1',
        name: 'Image Listing',
        slug: { current: 'image-listing' },
        type: ListingCategory.ACCOMMODATION,
        city: {
          _id: 'city-1',
          name: 'Bangkok',
          slug: 'bangkok',
          listingCount: 50,
          country: 'Thailand'
        },
        ecoTags: [],
        address: 'Address',
        primaryImage: {
          asset: {
            _ref: 'image-abc',
            url: 'https://example.com/image.jpg'
          }
        },
        galleryImages: [
          {
            asset: {
              _ref: 'image-1',
              url: 'https://example.com/gallery1.jpg'
            }
          }
        ]
      };
      expect(listing.primaryImage).toBeDefined();
      expect(listing.galleryImages).toHaveLength(1);
    });
  });

  describe('Specific listing types', () => {
    it('should accept CoworkingListing', () => {
      const listing: CoworkingListing = {
        _id: 'cowork-1',
        name: 'Coworking Space',
        slug: { current: 'coworking-space' },
        type: ListingCategory.COWORKING,
        city: {
          _id: 'city-1',
          name: 'Bangkok',
          slug: 'bangkok',
          listingCount: 50,
          country: 'Thailand'
        },
        ecoTags: [],
        address: 'Address',
        coworkingDetails: {
          deskTypes: ['hot', 'dedicated'],
          meetingRooms: true,
          internetSpeed: 100,
          printerScanner: true,
          parking: false,
          bikeParking: true,
          shower: false,
          airConditioning: true,
          kitchen: true,
          lockers: true,
          eventSpace: false,
          petFriendly: false,
          accessibility: true
        }
      };
      expect(listing.type).toBe('coworking');
      expect(listing.coworkingDetails.internetSpeed).toBe(100);
    });

    it('should accept CafeListing', () => {
      const listing: CafeListing = {
        _id: 'cafe-1',
        name: 'Cafe',
        slug: { current: 'cafe' },
        type: ListingCategory.CAFE,
        city: {
          _id: 'city-1',
          name: 'Bangkok',
          slug: 'bangkok',
          listingCount: 50,
          country: 'Thailand'
        },
        ecoTags: [],
        address: 'Address',
        cafeDetails: {
          wifi: true,
          powerOutlets: true,
          workspaceType: ['tables', 'bar'],
          noiseLevel: 'moderate',
          veganOptions: true,
          glutenFree: true,
          organicOptions: true
        }
      };
      expect(listing.type).toBe('cafe');
      expect(listing.cafeDetails.wifi).toBe(true);
    });

    it('should accept AccommodationListing', () => {
      const listing: AccommodationListing = {
        _id: 'acc-1',
        name: 'Accommodation',
        slug: { current: 'accommodation' },
        type: ListingCategory.ACCOMMODATION,
        city: {
          _id: 'city-1',
          name: 'Bangkok',
          slug: 'bangkok',
          listingCount: 50,
          country: 'Thailand'
        },
        ecoTags: [],
        address: 'Address',
        accommodationDetails: {
          roomTypes: ['private', 'shared'],
          minStay: 2,
          maxStay: 30,
          breakfast: true,
          kitchen: true,
          laundry: true,
          wifi: true,
          workspace: true,
          pool: false,
          airConditioning: true,
          heating: false
        }
      };
      expect(listing.type).toBe('accommodation');
      expect(listing.accommodationDetails.minStay).toBe(2);
    });

    it('should accept RestaurantListing', () => {
      const listing: RestaurantListing = {
        _id: 'rest-1',
        name: 'Restaurant',
        slug: { current: 'restaurant' },
        type: ListingCategory.RESTAURANT,
        city: {
          _id: 'city-1',
          name: 'Bangkok',
          slug: 'bangkok',
          listingCount: 50,
          country: 'Thailand'
        },
        ecoTags: [],
        address: 'Address',
        restaurantDetails: {
          cuisine: ['Thai', 'Fusion'],
          dietaryOptions: ['vegan', 'vegetarian'],
          pricePerPerson: 300,
          delivery: true,
          takeaway: true,
          reservation: true,
          outdoorSeating: true
        }
      };
      expect(listing.type).toBe('restaurant');
      expect(listing.restaurantDetails.cuisine).toContain('Thai');
    });

    it('should accept ActivitiesListing', () => {
      const listing: ActivitiesListing = {
        _id: 'act-1',
        name: 'Activity',
        slug: { current: 'activity' },
        type: ListingCategory.ACTIVITIES,
        city: {
          _id: 'city-1',
          name: 'Bangkok',
          slug: 'bangkok',
          listingCount: 50,
          country: 'Thailand'
        },
        ecoTags: [],
        address: 'Address',
        activitiesDetails: {
          category: ['outdoor', 'wellness'],
          duration: '3 hours',
          difficulty: 'moderate',
          groupSize: {
            min: 2,
            max: 10
          },
          seasonality: ['spring', 'summer'],
          equipment: true
        }
      };
      expect(listing.type).toBe('activities');
      expect(listing.activitiesDetails.difficulty).toBe('moderate');
    });
  });

  describe('Type safety', () => {
    it('should enforce type-specific details', () => {
      const coworkingListing: CoworkingListing = {
        _id: '1',
        name: 'Test',
        slug: { current: 'test' },
        type: ListingCategory.COWORKING,
        city: {
          _id: 'city-1',
          name: 'Bangkok',
          slug: 'bangkok',
          listingCount: 50,
          country: 'Thailand'
        },
        ecoTags: [],
        address: 'Address',
        coworkingDetails: {
          deskTypes: ['hot'],
          meetingRooms: false,
          internetSpeed: 50,
          printerScanner: false,
          parking: false,
          bikeParking: false,
          shower: false,
          airConditioning: false,
          kitchen: false,
          lockers: false,
          eventSpace: false,
          petFriendly: false,
          accessibility: false
        }
      };
      
      expect(coworkingListing.type).toBe('coworking');
    });
  });
});
