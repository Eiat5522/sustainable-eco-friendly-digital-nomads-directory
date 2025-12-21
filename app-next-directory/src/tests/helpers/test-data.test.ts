/**
 * Test suite for test data utilities and fixtures
 * Validates proper creation and retrieval of test users, listings, cities, favorites, and reviews
 */

import { describe, expect, it } from '@jest/globals';
import type { Role } from '@/models/User';
import {
  createTestData,
  getFavoritesForUser,
  getListingBySlug,
  getReviewsForListing,
  getSessionForRole,
  getTestUser,
  listCities,
  listEcoTags,
  mockListings,
  pickTags,
  TEST_SESSION_COOKIE_NAME,
} from './test-data';

describe('Test Data Utilities', () => {
  describe('TEST_SESSION_COOKIE_NAME', () => {
    it('should export the correct session cookie name', () => {
      expect(TEST_SESSION_COOKIE_NAME).toBe('authjs.session-token');
    });
  });

  describe('mockListings', () => {
    it('should export an array of mock listings', () => {
      expect(Array.isArray(mockListings)).toBe(true);
      expect(mockListings.length).toBeGreaterThan(0);
    });

    it('should contain listing objects with required properties', () => {
      const listing = mockListings[0];
      expect(listing._id).toBeDefined();
      expect(listing.slug).toBeDefined();
      expect(listing.name).toBeDefined();
    });
  });

  describe('createTestData', () => {
    it('should create test data with default values', () => {
      const testData = createTestData();

      expect(testData.users).toBeDefined();
      expect(testData.listings).toBeDefined();
      expect(testData.cities).toBeDefined();
      expect(testData.favorites).toBeDefined();
      expect(testData.reviews).toBeDefined();
      expect(testData.ecoTags).toBeDefined();
    });

    it('should create test data with multiple users', () => {
      const testData = createTestData();

      expect(Array.isArray(testData.users)).toBe(true);
      expect(testData.users.length).toBeGreaterThan(0);
    });

    it('should create test data with multiple listings', () => {
      const testData = createTestData();

      expect(Array.isArray(testData.listings)).toBe(true);
      expect(testData.listings.length).toBeGreaterThan(0);
    });

    it('should create test data with cities', () => {
      const testData = createTestData();

      expect(Array.isArray(testData.cities)).toBe(true);
      expect(testData.cities.length).toBeGreaterThan(0);
    });

    it('should override users when provided', () => {
      const customUser = {
        id: 'custom-user',
        name: 'Custom User',
        email: 'custom@example.com',
        role: 'user' as Role,
        plan: 'free' as const,
        password: 'password',
        sessionToken: 'custom-token',
      };

      const testData = createTestData({
        users: [customUser],
      });

      expect(testData.users.length).toBe(1);
      expect(testData.users[0].id).toBe('custom-user');
    });

    it('should override listings when provided', () => {
      const customListing = {
        _id: 'custom-listing',
        slug: { current: 'custom-slug' },
        name: 'Custom Listing',
        city: { name: 'Test City', slug: { current: 'test-city' } },
        type: 'coworking' as const,
        category: 'coworking' as const,
        address: '123 Test Street',
        shortDescription: 'Test description',
        longDescription: 'Test long description',
        ecoFocusTags: [],
        primaryImage: { asset: { _type: 'reference' as const, _ref: 'test-image' } },
        galleryImages: [],
        priceRange: '$$' as const,
        website: 'https://test.com',
        digitalNomadFeatures: [],
        lastVerifiedDate: '2024-01-01',
        moderationStatus: 'published' as const,
        verificationStatus: 'verified' as const,
        ecoRating: 85,
        coordinates: { latitude: 0, longitude: 0 },
        location: { lat: 0, lng: 0 },
      };

      const testData = createTestData({
        listings: [customListing],
      });

      expect(testData.listings.length).toBe(1);
      expect(testData.listings[0]._id).toBe('custom-listing');
    });

    it('should create deep clones of data', () => {
      const testData1 = createTestData();
      const testData2 = createTestData();

      // Modify one instance
      testData1.users[0].name = 'Modified Name';

      // Other instance should remain unchanged
      expect(testData2.users[0].name).not.toBe('Modified Name');
    });

    it('should override cities when provided', () => {
      const customCity = {
        id: 'custom-city',
        name: 'Custom City',
        slug: 'custom-city',
        country: 'Test Country',
        description: 'Test description',
        heroImage: 'https://test.com/image.jpg',
        coordinates: { lat: 0, lng: 0 },
        sustainabilityScore: 80,
        highlights: ['Test highlight'],
        listingIds: [],
      };

      const testData = createTestData({
        cities: [customCity],
      });

      expect(testData.cities.length).toBe(1);
      expect(testData.cities[0].id).toBe('custom-city');
    });

    it('should override favorites when provided', () => {
      const customFavorite = {
        id: 'custom-favorite',
        userId: 'user-1',
        listingId: 'listing-1',
        createdAt: '2024-01-01T00:00:00Z',
      };

      const testData = createTestData({
        favorites: [customFavorite],
      });

      expect(testData.favorites.length).toBe(1);
      expect(testData.favorites[0].id).toBe('custom-favorite');
    });

    it('should override reviews when provided', () => {
      const customReview = {
        id: 'custom-review',
        listingId: 'listing-1',
        userId: 'user-1',
        rating: 5,
        comment: 'Test comment',
        createdAt: '2024-01-01T00:00:00Z',
        user: {
          name: 'Test User',
          image: 'https://test.com/user.jpg',
        },
      };

      const testData = createTestData({
        reviews: [customReview],
      });

      expect(testData.reviews.length).toBe(1);
      expect(testData.reviews[0].id).toBe('custom-review');
    });

    it('should override ecoTags when provided', () => {
      const customTag = {
        _id: 'custom-tag',
        name: 'Custom Tag',
        slug: { current: 'custom-tag' },
        description: 'Custom description',
      };

      const testData = createTestData({
        ecoTags: [customTag],
      });

      expect(testData.ecoTags.length).toBe(1);
      expect(testData.ecoTags[0]._id).toBe('custom-tag');
    });
  });

  describe('getTestUser', () => {
    it('should get user by role', () => {
      const user = getTestUser('user');

      expect(user).toBeDefined();
      expect(user?.role).toBe('user');
    });

    it('should get admin user', () => {
      const admin = getTestUser('admin');

      expect(admin).toBeDefined();
      expect(admin?.role).toBe('admin');
      expect(admin?.email).toContain('admin');
    });

    it('should get venue owner user', () => {
      const venueOwner = getTestUser('venueOwner');

      expect(venueOwner).toBeDefined();
      expect(venueOwner?.role).toBe('venueOwner');
    });

    it('should return undefined for non-existent role', () => {
      const user = getTestUser('nonExistentRole' as Role);

      expect(user).toBeUndefined();
    });

    it('should return cloned user object', () => {
      const user1 = getTestUser('user');
      const user2 = getTestUser('user');

      expect(user1).not.toBe(user2);
      if (user1 && user2) {
        expect(user1.id).toBe(user2.id);
      }
    });
  });

  describe('getSessionForRole', () => {
    it('should get session for user role', () => {
      const session = getSessionForRole('user');

      expect(session).toBeDefined();
      expect(session?.user.role).toBe('user');
      expect(session?.token).toBeDefined();
    });

    it('should get session for admin role', () => {
      const session = getSessionForRole('admin');

      expect(session).toBeDefined();
      expect(session?.user.role).toBe('admin');
      expect(session?.token).toBe(session?.user.sessionToken);
    });

    it('should get session for super admin role', () => {
      const session = getSessionForRole('superAdmin');

      expect(session).toBeDefined();
      expect(session?.user.role).toBe('superAdmin');
    });

    it('should get session for venue owner role', () => {
      const session = getSessionForRole('venueOwner');

      expect(session).toBeDefined();
      expect(session?.user.role).toBe('venueOwner');
    });

    it('should return undefined for non-existent role', () => {
      const session = getSessionForRole('invalidRole' as Role);

      expect(session).toBeUndefined();
    });

    it('should include user object in session', () => {
      const session = getSessionForRole('user');

      expect(session?.user).toBeDefined();
      expect(session?.user.id).toBeDefined();
      expect(session?.user.email).toBeDefined();
    });
  });

  describe('getFavoritesForUser', () => {
    it('should get favorites for a specific user', () => {
      const favorites = getFavoritesForUser('user-riley-regular');

      expect(Array.isArray(favorites)).toBe(true);
      expect(favorites.length).toBeGreaterThan(0);
      favorites.forEach(fav => {
        expect(fav.userId).toBe('user-riley-regular');
      });
    });

    it('should return empty array for user with no favorites', () => {
      const favorites = getFavoritesForUser('non-existent-user');

      expect(Array.isArray(favorites)).toBe(true);
      expect(favorites.length).toBe(0);
    });

    it('should return cloned favorite objects', () => {
      const favorites1 = getFavoritesForUser('user-riley-regular');
      const favorites2 = getFavoritesForUser('user-riley-regular');

      expect(favorites1).not.toBe(favorites2);
      if (favorites1.length > 0 && favorites2.length > 0) {
        expect(favorites1[0]).not.toBe(favorites2[0]);
        expect(favorites1[0].id).toBe(favorites2[0].id);
      }
    });

    it('should get all favorites for venue owner', () => {
      const favorites = getFavoritesForUser('user-vera-venue');

      expect(favorites.length).toBeGreaterThanOrEqual(0);
      favorites.forEach(fav => {
        expect(fav.userId).toBe('user-vera-venue');
      });
    });
  });

  describe('getReviewsForListing', () => {
    it('should get reviews for a specific listing', () => {
      const reviews = getReviewsForListing('listing-bangkok-eco-hub');

      expect(Array.isArray(reviews)).toBe(true);
      expect(reviews.length).toBeGreaterThan(0);
      reviews.forEach(review => {
        expect(review.listingId).toBe('listing-bangkok-eco-hub');
      });
    });

    it('should return empty array for listing with no reviews', () => {
      const reviews = getReviewsForListing('non-existent-listing');

      expect(Array.isArray(reviews)).toBe(true);
      expect(reviews.length).toBe(0);
    });

    it('should return cloned review objects', () => {
      const reviews1 = getReviewsForListing('listing-bangkok-eco-hub');
      const reviews2 = getReviewsForListing('listing-bangkok-eco-hub');

      expect(reviews1).not.toBe(reviews2);
      if (reviews1.length > 0 && reviews2.length > 0) {
        expect(reviews1[0]).not.toBe(reviews2[0]);
        expect(reviews1[0].id).toBe(reviews2[0].id);
      }
    });

    it('should include user information in reviews', () => {
      const reviews = getReviewsForListing('listing-bangkok-eco-hub');

      if (reviews.length > 0) {
        expect(reviews[0].user).toBeDefined();
        expect(reviews[0].user.name).toBeDefined();
      }
    });

    it('should get reviews for Lisbon listing', () => {
      const reviews = getReviewsForListing('listing-lisbon-earth-stay');

      expect(reviews.length).toBeGreaterThanOrEqual(0);
      reviews.forEach(review => {
        expect(review.listingId).toBe('listing-lisbon-earth-stay');
      });
    });
  });

  describe('getListingBySlug', () => {
    it('should get listing by slug', () => {
      const listing = getListingBySlug('bangkok-eco-hub');

      expect(listing).toBeDefined();
      expect(listing?.slug.current).toBe('bangkok-eco-hub');
      expect(listing?.name).toBe('Bangkok Eco Hub');
    });

    it('should get Chiang Mai listing by slug', () => {
      const listing = getListingBySlug('chiang-mai-green-cafe');

      expect(listing).toBeDefined();
      expect(listing?.slug.current).toBe('chiang-mai-green-cafe');
    });

    it('should get Lisbon listing by slug', () => {
      const listing = getListingBySlug('lisbon-earth-stay');

      expect(listing).toBeDefined();
      expect(listing?.slug.current).toBe('lisbon-earth-stay');
    });

    it('should return undefined for non-existent slug', () => {
      const listing = getListingBySlug('non-existent-slug');

      expect(listing).toBeUndefined();
    });

    it('should return cloned listing object', () => {
      const listing1 = getListingBySlug('bangkok-eco-hub');
      const listing2 = getListingBySlug('bangkok-eco-hub');

      expect(listing1).not.toBe(listing2);
      if (listing1 && listing2) {
        expect(listing1._id).toBe(listing2._id);
      }
    });

    it('should include all listing properties', () => {
      const listing = getListingBySlug('bangkok-eco-hub');

      expect(listing?._id).toBeDefined();
      expect(listing?.city).toBeDefined();
      expect(listing?.type).toBeDefined();
      expect(listing?.ecoFocusTags).toBeDefined();
      expect(listing?.coordinates).toBeDefined();
    });
  });

  describe('listCities', () => {
    it('should list all cities', () => {
      const cities = listCities();

      expect(Array.isArray(cities)).toBe(true);
      expect(cities.length).toBeGreaterThan(0);
    });

    it('should include Bangkok', () => {
      const cities = listCities();
      const bangkok = cities.find(city => city.slug === 'bangkok');

      expect(bangkok).toBeDefined();
      expect(bangkok?.name).toBe('Bangkok');
    });

    it('should include Chiang Mai', () => {
      const cities = listCities();
      const chiangMai = cities.find(city => city.slug === 'chiang-mai');

      expect(chiangMai).toBeDefined();
      expect(chiangMai?.name).toBe('Chiang Mai');
    });

    it('should include Lisbon', () => {
      const cities = listCities();
      const lisbon = cities.find(city => city.slug === 'lisbon');

      expect(lisbon).toBeDefined();
      expect(lisbon?.name).toBe('Lisbon');
    });

    it('should return cloned city objects', () => {
      const cities1 = listCities();
      const cities2 = listCities();

      expect(cities1).not.toBe(cities2);
      expect(cities1[0]).not.toBe(cities2[0]);
      expect(cities1[0].id).toBe(cities2[0].id);
    });

    it('should include all city properties', () => {
      const cities = listCities();
      const city = cities[0];

      expect(city.id).toBeDefined();
      expect(city.name).toBeDefined();
      expect(city.slug).toBeDefined();
      expect(city.country).toBeDefined();
      expect(city.coordinates).toBeDefined();
      expect(city.sustainabilityScore).toBeDefined();
      expect(city.highlights).toBeDefined();
    });
  });

  describe('clone functionality', () => {
    it('should clone objects using structuredClone when available', () => {
      const testData1 = createTestData();
      const testData2 = createTestData();

      // Modify one object
      testData1.users[0].email = 'modified@example.com';

      // Verify other object is unaffected
      expect(testData2.users[0].email).not.toBe('modified@example.com');
    });

    it('should clone objects using JSON when structuredClone is not available', () => {
      // Save the original structuredClone
      const originalStructuredClone = global.structuredClone;

      // Temporarily delete structuredClone to test the fallback
      // @ts-expect-error - Intentionally deleting for test
      delete global.structuredClone;

      try {
        const testData1 = createTestData();
        const testData2 = createTestData();

        // Modify one object
        testData1.users[0].email = 'modified@example.com';

        // Verify other object is unaffected
        expect(testData2.users[0].email).not.toBe('modified@example.com');
      } finally {
        // Restore structuredClone
        global.structuredClone = originalStructuredClone;
      }
    });

    it('should handle deep cloning of nested objects', () => {
      const listing1 = getListingBySlug('bangkok-eco-hub');
      const listing2 = getListingBySlug('bangkok-eco-hub');

      if (listing1 && listing2) {
        // Modify nested property in one listing
        listing1.city.name = 'Modified City';

        // Verify other listing is unaffected
        expect(listing2.city.name).not.toBe('Modified City');
      }
    });

    it('should handle cloning of arrays within objects', () => {
      const listing1 = getListingBySlug('bangkok-eco-hub');
      const listing2 = getListingBySlug('bangkok-eco-hub');

      if (listing1 && listing2 && listing1.ecoFocusTags && listing2.ecoFocusTags) {
        // Modify array in one listing
        listing1.ecoFocusTags.push({
          _id: 'new-tag',
          name: 'New Tag',
          slug: { current: 'new-tag' },
          description: 'New description',
        });

        // Verify other listing array is unaffected
        expect(listing2.ecoFocusTags.length).not.toBe(listing1.ecoFocusTags.length);
      }
    });
  });

  describe('pickTags', () => {
    it('should throw error for unknown eco tag', () => {
      expect(() => {
        pickTags('invalid-slug');
      }).toThrow('Unknown eco tag requested: invalid-slug');
    });

    it('should return valid tags when given valid slugs', () => {
      const tags = pickTags('zero-waste', 'solar-powered');

      expect(tags.length).toBe(2);
      expect(tags[0].slug.current).toBe('zero-waste');
      expect(tags[1].slug.current).toBe('solar-powered');
    });

    it('should return cloned tag objects', () => {
      const tags1 = pickTags('zero-waste');
      const tags2 = pickTags('zero-waste');

      expect(tags1).not.toBe(tags2);
      expect(tags1[0]).not.toBe(tags2[0]);
      expect(tags1[0]._id).toBe(tags2[0]._id);
    });
  });

  describe('listEcoTags', () => {
    it('should list all eco tags', () => {
      const tags = listEcoTags();

      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0);
    });

    it('should include Zero Waste tag', () => {
      const tags = listEcoTags();
      const zeroWaste = tags.find(tag => tag.slug.current === 'zero-waste');

      expect(zeroWaste).toBeDefined();
      expect(zeroWaste?.name).toContain('Zero Waste');
    });

    it('should include Solar Powered tag', () => {
      const tags = listEcoTags();
      const solar = tags.find(tag => tag.slug.current === 'solar-powered');

      expect(solar).toBeDefined();
      expect(solar?.name).toContain('Solar');
    });

    it('should include Plant Forward tag', () => {
      const tags = listEcoTags();
      const plantForward = tags.find(tag => tag.slug.current === 'plant-forward');

      expect(plantForward).toBeDefined();
    });

    it('should include Water Wise tag', () => {
      const tags = listEcoTags();
      const waterWise = tags.find(tag => tag.slug.current === 'water-wise');

      expect(waterWise).toBeDefined();
    });

    it('should include Community Builder tag', () => {
      const tags = listEcoTags();
      const community = tags.find(tag => tag.slug.current === 'community-builder');

      expect(community).toBeDefined();
    });

    it('should return cloned tag objects', () => {
      const tags1 = listEcoTags();
      const tags2 = listEcoTags();

      expect(tags1).not.toBe(tags2);
      expect(tags1[0]).not.toBe(tags2[0]);
      expect(tags1[0]._id).toBe(tags2[0]._id);
    });

    it('should include all tag properties', () => {
      const tags = listEcoTags();
      const tag = tags[0];

      expect(tag._id).toBeDefined();
      expect(tag.name).toBeDefined();
      expect(tag.slug).toBeDefined();
      expect(tag.slug.current).toBeDefined();
      expect(tag.description).toBeDefined();
    });
  });
});
