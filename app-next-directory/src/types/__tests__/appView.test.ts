import type {
  AppCity,
  SanityImage,
  SanityGalleryImage,
  AppListingCard,
  AppListingDetail,
  AppReview,
  AppFilterState
} from '../appView';

describe('appView types', () => {
  describe('AppCity type', () => {
    it('should accept basic city', () => {
      const city: AppCity = {
        id: 'city-123',
        name: 'Bangkok',
        slug: 'bangkok'
      };
      expect(city.id).toBe('city-123');
      expect(city.name).toBe('Bangkok');
    });

    it('should accept city with all optional fields', () => {
      const city: AppCity = {
        id: 'city-456',
        name: 'Chiang Mai',
        slug: 'chiang-mai',
        country: 'Thailand',
        sustainabilityScore: 90,
        highlights: ['Mountains', 'Digital Nomad Hub'],
        primaryImage: {
          asset: { _id: 'img-1', url: 'https://example.com/img.jpg' }
        },
        description: 'Beautiful mountain city'
      };
      expect(city.sustainabilityScore).toBe(90);
      expect(city.highlights).toContain('Mountains');
    });
  });

  describe('SanityImage and SanityGalleryImage types', () => {
    it('should accept SanityImage', () => {
      const image: SanityImage = {
        asset: { _id: 'img-1', url: 'https://example.com/img.jpg' }
      };
      expect(image.asset.url).toBeDefined();
    });

    it('should accept SanityGalleryImage with _key', () => {
      const image: SanityGalleryImage = {
        _key: 'gallery-1',
        asset: { _id: 'img-1', url: 'https://example.com/img.jpg' }
      };
      expect(image._key).toBe('gallery-1');
    });
  });

  describe('AppListingCard type', () => {
    it('should accept minimal listing card', () => {
      const card: AppListingCard = {
        id: 'listing-123',
        name: 'Eco Coworking',
        slug: 'eco-coworking',
        city: {
          id: 'city-1',
          name: 'Bangkok',
          slug: 'bangkok'
        },
        ecoFocusTags: ['solar-power', 'recycling']
      };
      expect(card.id).toBe('listing-123');
      expect(card.ecoFocusTags).toContain('solar-power');
    });

    it('should accept card with null city', () => {
      const card: AppListingCard = {
        id: 'listing-456',
        name: 'Test Listing',
        slug: 'test-listing',
        city: null,
        ecoFocusTags: []
      };
      expect(card.city).toBeNull();
    });

    it('should accept card with all optional fields', () => {
      const card: AppListingCard = {
        id: 'listing-789',
        name: 'Complete Listing',
        slug: 'complete-listing',
        city: { id: 'city-1', name: 'Bangkok', slug: 'bangkok' },
        ecoFocusTags: ['solar'],
        digitalNomadFeatures: ['wifi', 'desk'],
        priceRange: 'moderate',
        website: 'https://example.com',
        imageUrl: 'https://example.com/img.jpg',
        primaryImage: {
          asset: { _id: 'img-1', url: 'https://example.com/img.jpg' }
        },
        galleryImages: [
          {
            _key: 'img-1',
            asset: { _id: 'img-1', url: 'https://example.com/gallery1.jpg' }
          }
        ],
        type: 'coworking',
        shortDescription: 'Great workspace',
        address: '123 Main St',
        category: 'coworking',
        location: { lat: 13.7563, lng: 100.5018 }
      };
      expect(card.priceRange).toBe('moderate');
      expect(card.location?.lat).toBe(13.7563);
    });
  });

  describe('AppListingDetail type', () => {
    it('should extend AppListingCard', () => {
      const detail: AppListingDetail = {
        id: 'listing-1',
        name: 'Detail Listing',
        slug: 'detail-listing',
        city: null,
        ecoFocusTags: []
      };
      expect(detail.id).toBe('listing-1');
    });

    it('should accept contact information', () => {
      const detail: AppListingDetail = {
        id: 'listing-1',
        name: 'Contact Listing',
        slug: 'contact-listing',
        city: null,
        ecoFocusTags: [],
        contactPhone: '+66-123-4567',
        contactEmail: 'info@example.com'
      };
      expect(detail.contactPhone).toBe('+66-123-4567');
      expect(detail.contactEmail).toBe('info@example.com');
    });

    it('should accept descriptions', () => {
      const detail: AppListingDetail = {
        id: 'listing-1',
        name: 'Described Listing',
        slug: 'described-listing',
        city: null,
        ecoFocusTags: [],
        shortDescription: 'Short desc',
        longDescription: 'Long description here'
      };
      expect(detail.shortDescription).toBe('Short desc');
    });

    it('should accept coworking details', () => {
      const detail: AppListingDetail = {
        id: 'listing-1',
        name: 'Coworking',
        slug: 'coworking',
        city: null,
        ecoFocusTags: [],
        coworkingDetails: {
          pricingPlans: [
            { type: 'daily', price: 300, period: 'day' }
          ],
          openingHours: [
            { day: 'Monday', opens: '09:00', closes: '18:00' }
          ],
          internetSpeed: { download: 100, upload: 50 }
        }
      };
      expect(detail.coworkingDetails?.pricingPlans).toHaveLength(1);
    });

    it('should accept accommodation details', () => {
      const detail: AppListingDetail = {
        id: 'listing-1',
        name: 'Accommodation',
        slug: 'accommodation',
        city: null,
        ecoFocusTags: [],
        accommodationDetails: {
          accommodationType: 'Hotel',
          pricePerNightThb: { min: 500, max: 2000 },
          roomTypesAvailable: [
            { type: 'Single', pricePerNight: 500 },
            { type: 'Double', pricePerNight: 800 }
          ],
          minimumStay: 2,
          coworkingPartnership: { hasPartnership: true, partner: 'Local Cowork' }
        }
      };
      expect(detail.accommodationDetails?.accommodationType).toBe('Hotel');
      expect(detail.accommodationDetails?.minimumStay).toBe(2);
    });

    it('should accept cafe details', () => {
      const detail: AppListingDetail = {
        id: 'listing-1',
        name: 'Cafe',
        slug: 'cafe',
        city: null,
        ecoFocusTags: [],
        cafeDetails: {
          openingHours: [
            { day: 'Monday', opens: '07:00', closes: '19:00' }
          ],
          priceIndication: '$-$$',
          menuHighlights: ['Organic coffee', 'Pastries'],
          workspaceAmenities: ['WiFi', 'Power outlets'],
          maxRecommendedStay: 4,
          noiseLevel: 'moderate',
          powerOutlets: { availability: 'every table' },
          workPolicy: { laptopsAllowed: true, timeLimit: 4 },
          veganFriendly: { isVeganFriendly: true, veganOptions: 5 }
        }
      };
      expect(detail.cafeDetails?.noiseLevel).toBe('moderate');
    });

    it('should accept restaurant details', () => {
      const detail: AppListingDetail = {
        id: 'listing-1',
        name: 'Restaurant',
        slug: 'restaurant',
        city: null,
        ecoFocusTags: [],
        restaurantDetails: {
          cuisineType: ['Thai', 'Fusion'],
          priceRange: 'moderate',
          operatingHours: '11:00 AM - 10:00 PM',
          sustainabilityInitiatives: ['Local sourcing', 'Composting'],
          dietaryOptions: ['Vegetarian', 'Vegan'],
          seating: ['Indoor', 'Outdoor'],
          workFriendly: ['WiFi available'],
          averageMealPriceThb: { min: 150, max: 500 }
        }
      };
      expect(detail.restaurantDetails?.cuisineType).toContain('Thai');
    });

    it('should accept activities details', () => {
      const detail: AppListingDetail = {
        id: 'listing-1',
        name: 'Activity',
        slug: 'activity',
        city: null,
        ecoFocusTags: [],
        activitiesDetails: {
          activityType: 'Hiking',
          duration: { value: 3, unit: 'hours' },
          groupSize: { min: 2, max: 10 },
          sustainabilityPractices: ['Leave no trace'],
          skillLevel: 'beginner',
          ecoScore: {
            score: 4.5,
            certifications: ['Eco Tour'],
            justification: 'Low impact'
          },
          languages: ['English', 'Thai'],
          accessibility: {
            wheelchairAccessible: false,
            mobilityLevel: 'moderate'
          },
          seasonality: {
            bestMonths: ['November', 'December', 'January'],
            weatherDependent: true
          }
        }
      };
      expect(detail.activitiesDetails?.activityType).toBe('Hiking');
    });

    it('should accept reviews', () => {
      const detail: AppListingDetail = {
        id: 'listing-1',
        name: 'Reviewed Listing',
        slug: 'reviewed-listing',
        city: null,
        ecoFocusTags: [],
        reviews: [
          {
            id: 'review-1',
            listingId: 'listing-1',
            userId: 'user-1',
            rating: 5,
            comment: 'Great place!',
            createdAt: '2024-01-15',
            user: { name: 'John Doe' }
          }
        ]
      };
      expect(detail.reviews).toHaveLength(1);
    });
  });

  describe('AppReview type', () => {
    it('should accept complete review', () => {
      const review: AppReview = {
        id: 'review-123',
        listingId: 'listing-456',
        userId: 'user-789',
        rating: 4,
        comment: 'Good experience',
        createdAt: '2024-01-15T10:00:00Z',
        user: {
          name: 'Jane Smith',
          image: 'https://example.com/avatar.jpg'
        }
      };
      expect(review.rating).toBe(4);
      expect(review.user.name).toBe('Jane Smith');
    });

    it('should accept review without user image', () => {
      const review: AppReview = {
        id: 'review-1',
        listingId: 'listing-1',
        userId: 'user-1',
        rating: 5,
        comment: 'Excellent!',
        createdAt: '2024-01-15',
        user: { name: 'Bob Johnson' }
      };
      expect(review.user.image).toBeUndefined();
    });
  });

  describe('AppFilterState type', () => {
    it('should accept empty filter state', () => {
      const filters: AppFilterState = {
        location: null,
        categories: [],
        ecoFocusTags: [],
        digitalNomadFeatures: [],
        priceRanges: [],
        searchQuery: ''
      };
      expect(filters.location).toBeNull();
      expect(filters.categories).toHaveLength(0);
    });

    it('should accept populated filter state', () => {
      const filters: AppFilterState = {
        location: 'Bangkok',
        categories: ['coworking', 'cafe'],
        ecoFocusTags: ['solar-power', 'recycling'],
        digitalNomadFeatures: ['wifi', 'desk'],
        priceRanges: ['budget', 'moderate'],
        searchQuery: 'eco workspace',
        sort: { field: 'rating', direction: 'desc' }
      };
      expect(filters.location).toBe('Bangkok');
      expect(filters.categories).toContain('coworking');
      expect(filters.searchQuery).toBe('eco workspace');
    });

    it('should accept filter with null location', () => {
      const filters: AppFilterState = {
        location: null,
        categories: ['coworking'],
        ecoFocusTags: [],
        digitalNomadFeatures: [],
        priceRanges: [],
        searchQuery: 'test'
      };
      expect(filters.location).toBeNull();
    });
  });

  describe('Integration scenarios', () => {
    it('should support listing card to detail conversion', () => {
      const card: AppListingCard = {
        id: 'listing-1',
        name: 'Test Listing',
        slug: 'test-listing',
        city: { id: 'city-1', name: 'Bangkok', slug: 'bangkok' },
        ecoFocusTags: ['solar']
      };

      const detail: AppListingDetail = {
        ...card,
        shortDescription: 'A great place',
        contactEmail: 'info@example.com'
      };

      expect(detail.id).toBe(card.id);
      expect(detail.shortDescription).toBeDefined();
    });

    it('should support filtering with AppFilterState', () => {
      const listings: AppListingCard[] = [
        {
          id: '1',
          name: 'Coworking 1',
          slug: 'coworking-1',
          city: { id: 'city-1', name: 'Bangkok', slug: 'bangkok' },
          ecoFocusTags: ['solar'],
          type: 'coworking'
        },
        {
          id: '2',
          name: 'Cafe 1',
          slug: 'cafe-1',
          city: { id: 'city-1', name: 'Bangkok', slug: 'bangkok' },
          ecoFocusTags: ['recycling'],
          type: 'cafe'
        }
      ];

      const filters: AppFilterState = {
        location: 'Bangkok',
        categories: ['coworking'],
        ecoFocusTags: [],
        digitalNomadFeatures: [],
        priceRanges: [],
        searchQuery: ''
      };

      const filtered = listings.filter(
        listing => filters.categories.length === 0 || filters.categories.includes(listing.type || '')
      );

      expect(filtered).toHaveLength(1);
    });
  });
});
