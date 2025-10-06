import type {
  GalleryImage,
  PricingPlan,
  Coordinates,
  EcoTag,
  Listing
} from '../listings';

describe('listings types', () => {
  describe('Coordinates interface', () => {
    it('should accept valid coordinates', () => {
      const coords: Coordinates = {
        latitude: 13.7563,
        longitude: 100.5018
      };
      expect(coords.latitude).toBe(13.7563);
      expect(coords.longitude).toBe(100.5018);
    });

    it('should accept null coordinates', () => {
      const coords: Coordinates = {
        latitude: null,
        longitude: null
      };
      expect(coords.latitude).toBeNull();
      expect(coords.longitude).toBeNull();
    });

    it('should accept mixed null and number', () => {
      const coords: Coordinates = {
        latitude: 13.7563,
        longitude: null
      };
      expect(coords.latitude).toBe(13.7563);
      expect(coords.longitude).toBeNull();
    });
  });

  describe('EcoTag interface', () => {
    it('should accept complete eco tag', () => {
      const tag: EcoTag = {
        _id: 'tag-123',
        name: 'Solar Power',
        slug: { current: 'solar-power' },
        description: 'Uses solar energy'
      };
      expect(tag._id).toBe('tag-123');
      expect(tag.name).toBe('Solar Power');
    });

    it('should accept tag without description', () => {
      const tag: EcoTag = {
        _id: 'tag-456',
        name: 'Recycling',
        slug: { current: 'recycling' }
      };
      expect(tag.description).toBeUndefined();
    });
  });

  describe('PricingPlan interface', () => {
    it('should accept valid pricing plan', () => {
      const plan: PricingPlan = {
        name: 'Monthly',
        price: 5000,
        duration: '1 month',
        features: ['24/7 access', 'Meeting rooms', 'Free coffee']
      };
      expect(plan.name).toBe('Monthly');
      expect(plan.price).toBe(5000);
      expect(plan.features).toHaveLength(3);
    });

    it('should accept plan with empty features', () => {
      const plan: PricingPlan = {
        name: 'Basic',
        price: 500,
        duration: '1 day',
        features: []
      };
      expect(plan.features).toHaveLength(0);
    });

    it('should accept plan with many features', () => {
      const plan: PricingPlan = {
        name: 'Premium',
        price: 10000,
        duration: '1 month',
        features: [
          'Private office',
          'Meeting rooms',
          'Parking',
          'Locker',
          'Phone booth',
          'Event space'
        ]
      };
      expect(plan.features.length).toBeGreaterThan(3);
    });
  });

  describe('Listing interface', () => {
    it('should accept minimal listing', () => {
      const listing: Listing = {
        _id: 'listing-123',
        name: 'Test Listing',
        city: { name: 'Bangkok', slug: { current: 'bangkok' } },
        type: 'coworking',
        address: '123 Main St',
        shortDescription: 'A test listing',
        longDescription: 'A detailed test listing',
        ecoFocusTags: [],
        digitalNomadFeatures: [],
        lastVerifiedDate: '2024-01-15'
      };
      expect(listing._id).toBe('listing-123');
      expect(listing.name).toBe('Test Listing');
    });

    it('should accept all listing types', () => {
      const types: Listing['type'][] = [
        'coworking',
        'cafe',
        'accommodation',
        'restaurant',
        'activities'
      ];
      
      types.forEach(type => {
        const listing: Listing = {
          _id: `listing-${type}`,
          name: `${type} listing`,
          city: { name: 'Bangkok', slug: { current: 'bangkok' } },
          type,
          address: 'Address',
          shortDescription: 'Short desc',
          longDescription: 'Long desc',
          ecoFocusTags: [],
          digitalNomadFeatures: [],
          lastVerifiedDate: '2024-01-15'
        };
        expect(listing.type).toBe(type);
      });
    });

    it('should accept listing with slug', () => {
      const listing: Listing = {
        _id: 'listing-1',
        slug: { current: 'eco-workspace' },
        name: 'Eco Workspace',
        city: { name: 'Bangkok', slug: { current: 'bangkok' } },
        type: 'coworking',
        address: 'Address',
        shortDescription: 'Desc',
        longDescription: 'Long desc',
        ecoFocusTags: [],
        digitalNomadFeatures: [],
        lastVerifiedDate: '2024-01-15'
      };
      expect(listing.slug?.current).toBe('eco-workspace');
    });

    it('should accept listing with eco focus tags', () => {
      const listing: Listing = {
        _id: 'listing-1',
        name: 'Eco Space',
        city: { name: 'Bangkok', slug: { current: 'bangkok' } },
        type: 'coworking',
        address: 'Address',
        shortDescription: 'Desc',
        longDescription: 'Long desc',
        ecoFocusTags: [
          { _id: 'tag-1', name: 'Solar', slug: { current: 'solar' } },
          { _id: 'tag-2', name: 'Recycling', slug: { current: 'recycling' } }
        ],
        digitalNomadFeatures: [],
        lastVerifiedDate: '2024-01-15'
      };
      expect(listing.ecoFocusTags).toHaveLength(2);
    });

    it('should accept listing with images', () => {
      const listing: Listing = {
        _id: 'listing-1',
        name: 'Image Listing',
        city: { name: 'Bangkok', slug: { current: 'bangkok' } },
        type: 'cafe',
        address: 'Address',
        shortDescription: 'Desc',
        longDescription: 'Long desc',
        ecoFocusTags: [],
        digitalNomadFeatures: [],
        lastVerifiedDate: '2024-01-15',
        primaryImage: {
          asset: { _id: 'img-1', url: 'https://example.com/main.jpg' },
          hotspot: { x: 0.5, y: 0.5 }
        },
        galleryImages: [
          {
            _key: 'img-2',
            asset: { _id: 'img-2', url: 'https://example.com/gallery1.jpg' }
          }
        ]
      };
      expect(listing.primaryImage).toBeDefined();
      expect(listing.galleryImages).toHaveLength(1);
    });

    it('should accept listing with price range and website', () => {
      const listing: Listing = {
        _id: 'listing-1',
        name: 'Priced Listing',
        city: { name: 'Bangkok', slug: { current: 'bangkok' } },
        type: 'accommodation',
        address: 'Address',
        shortDescription: 'Desc',
        longDescription: 'Long desc',
        ecoFocusTags: [],
        digitalNomadFeatures: ['wifi', 'desk'],
        lastVerifiedDate: '2024-01-15',
        priceRange: 'moderate',
        website: 'https://example.com'
      };
      expect(listing.priceRange).toBe('moderate');
      expect(listing.website).toBe('https://example.com');
    });

    it('should accept listing with category and location', () => {
      const listing: Listing = {
        _id: 'listing-1',
        name: 'Located Listing',
        city: { name: 'Bangkok', slug: { current: 'bangkok' } },
        type: 'restaurant',
        address: '456 Food St',
        shortDescription: 'Desc',
        longDescription: 'Long desc',
        ecoFocusTags: [],
        digitalNomadFeatures: [],
        lastVerifiedDate: '2024-01-15',
        category: 'restaurant',
        location: { lat: 13.7563, lng: 100.5018 }
      };
      expect(listing.category).toBe('restaurant');
      expect(listing.location?.lat).toBe(13.7563);
    });

    it('should accept listing with moderation status', () => {
      const listing: Listing = {
        _id: 'listing-1',
        name: 'Moderated Listing',
        city: { name: 'Bangkok', slug: { current: 'bangkok' } },
        type: 'coworking',
        address: 'Address',
        shortDescription: 'Desc',
        longDescription: 'Long desc',
        ecoFocusTags: [],
        digitalNomadFeatures: [],
        lastVerifiedDate: '2024-01-15',
        moderationStatus: 'published',
        verificationStatus: 'verified'
      };
      expect(listing.moderationStatus).toBe('published');
      expect(listing.verificationStatus).toBe('verified');
    });

    it('should accept listing with eco rating', () => {
      const listing: Listing = {
        _id: 'listing-1',
        name: 'Rated Listing',
        city: { name: 'Bangkok', slug: { current: 'bangkok' } },
        type: 'cafe',
        address: 'Address',
        shortDescription: 'Desc',
        longDescription: 'Long desc',
        ecoFocusTags: [],
        digitalNomadFeatures: [],
        lastVerifiedDate: '2024-01-15',
        ecoRating: 4.5
      };
      expect(listing.ecoRating).toBe(4.5);
    });

    it('should accept listing with coordinates', () => {
      const listing: Listing = {
        _id: 'listing-1',
        name: 'Coordinated Listing',
        city: { name: 'Bangkok', slug: { current: 'bangkok' } },
        type: 'accommodation',
        address: 'Address',
        shortDescription: 'Desc',
        longDescription: 'Long desc',
        ecoFocusTags: [],
        digitalNomadFeatures: [],
        lastVerifiedDate: '2024-01-15',
        coordinates: { latitude: 13.7563, longitude: 100.5018 }
      };
      expect(listing.coordinates?.latitude).toBe(13.7563);
    });

    it('should accept listing with coworking details', () => {
      const listing: Listing = {
        _id: 'listing-1',
        name: 'Coworking Space',
        city: { name: 'Bangkok', slug: { current: 'bangkok' } },
        type: 'coworking',
        address: 'Address',
        shortDescription: 'Desc',
        longDescription: 'Long desc',
        ecoFocusTags: [],
        digitalNomadFeatures: [],
        lastVerifiedDate: '2024-01-15',
        coworkingDetails: {
          operatingHours: '9:00 AM - 6:00 PM',
          pricingPlans: [
            { name: 'Daily', price: 300, duration: 'day', features: ['WiFi', 'Coffee'] }
          ],
          specificAmenitiesCoworking: ['Meeting rooms', 'Printer']
        }
      };
      expect(listing.coworkingDetails?.pricingPlans).toHaveLength(1);
      expect(listing.coworkingDetails?.specificAmenitiesCoworking).toContain('Printer');
    });

    it('should accept listing with cafe details', () => {
      const listing: Listing = {
        _id: 'listing-1',
        name: 'Cafe',
        city: { name: 'Bangkok', slug: { current: 'bangkok' } },
        type: 'cafe',
        address: 'Address',
        shortDescription: 'Desc',
        longDescription: 'Long desc',
        ecoFocusTags: [],
        digitalNomadFeatures: [],
        lastVerifiedDate: '2024-01-15',
        cafeDetails: {
          operatingHours: '7:00 AM - 7:00 PM',
          priceIndication: '$-$$',
          menuHighlightsCafe: ['Organic coffee', 'Vegan pastries'],
          wifiReliabilityNotes: 'Fast and stable'
        }
      };
      expect(listing.cafeDetails?.menuHighlightsCafe).toContain('Organic coffee');
    });

    it('should accept listing with accommodation details', () => {
      const listing: Listing = {
        _id: 'listing-1',
        name: 'Accommodation',
        city: { name: 'Bangkok', slug: { current: 'bangkok' } },
        type: 'accommodation',
        address: 'Address',
        shortDescription: 'Desc',
        longDescription: 'Long desc',
        ecoFocusTags: [],
        digitalNomadFeatures: [],
        lastVerifiedDate: '2024-01-15',
        accommodationDetails: {
          accommodationType: 'Hotel',
          pricePerNightThbRange: { min: 500, max: 2000 },
          roomTypesAvailable: ['Single', 'Double', 'Suite'],
          specificAmenitiesAccommodation: ['Pool', 'Gym', 'Restaurant']
        }
      };
      expect(listing.accommodationDetails?.roomTypesAvailable).toHaveLength(3);
      expect(listing.accommodationDetails?.pricePerNightThbRange.min).toBe(500);
    });
  });

  describe('Type compatibility', () => {
    it('should accept GalleryImage as SanityImage', () => {
      const image: GalleryImage = {
        asset: { _id: 'img-1', url: 'https://example.com/img.jpg' }
      };
      expect(image.asset.url).toBeDefined();
    });

    it('should accept GalleryImage with _key', () => {
      const image: GalleryImage = {
        _key: 'gallery-1',
        asset: { _id: 'img-1', url: 'https://example.com/img.jpg' }
      };
      expect(image._key).toBe('gallery-1');
    });
  });
});
