import { describe, expect, it } from '@jest/globals';

import {
  integrationCities,
  integrationFavorites,
  integrationListings,
  integrationReviews,
  integrationTestData,
  integrationUsers,
} from '@/tests/fixtures';
import { createTestData } from '@/tests/helpers/test-data';

const expectedListingIds = [
  'listing-bangkok-eco-hub',
  'listing-chiang-mai-green-cafe',
  'listing-lisbon-earth-stay',
];

const expectedUserIds = [
  'user-riley-regular',
  'user-vera-venue',
  'user-ada-admin',
  'user-sam-superadmin',
];

const expectedCityIds = ['city-bangkok', 'city-chiang-mai', 'city-lisbon'];

const expectedReviewIds = ['review-bangkok-1', 'review-bangkok-2', 'review-lisbon-1'];

const expectedFavoriteIds = ['fav-riley-bangkok', 'fav-riley-chiang-mai', 'fav-vera-lisbon'];

describe('tests/fixtures/index', () => {
  it('creates integration test data using the default factory state', () => {
    const freshData = createTestData();

    expect(integrationTestData).toEqual(freshData);
    expect(integrationTestData.listings).toHaveLength(expectedListingIds.length);
    expect(integrationTestData.users).toHaveLength(expectedUserIds.length);
    expect(integrationTestData.cities).toHaveLength(expectedCityIds.length);
    expect(integrationTestData.reviews).toHaveLength(expectedReviewIds.length);
    expect(integrationTestData.favorites).toHaveLength(expectedFavoriteIds.length);
  });

  it('exposes convenient references that point to the integrationTestData collections', () => {
    expect(integrationListings).toBe(integrationTestData.listings);
    expect(integrationUsers).toBe(integrationTestData.users);
    expect(integrationCities).toBe(integrationTestData.cities);
    expect(integrationFavorites).toBe(integrationTestData.favorites);
    expect(integrationReviews).toBe(integrationTestData.reviews);
  });

  it('provides the expected records with stable identifiers', () => {
    expect(integrationListings.map(listing => listing._id)).toEqual(
      expect.arrayContaining(expectedListingIds)
    );
    expect(integrationUsers.map(user => user.id)).toEqual(expect.arrayContaining(expectedUserIds));
    expect(integrationCities.map(city => city.id)).toEqual(expect.arrayContaining(expectedCityIds));
    expect(integrationReviews.map(review => review._id)).toEqual(
      expect.arrayContaining(expectedReviewIds)
    );
    expect(integrationFavorites.map(favorite => favorite.id)).toEqual(
      expect.arrayContaining(expectedFavoriteIds)
    );
  });

  it('links favorites to valid users and listings', () => {
    const listingIds = new Set(integrationListings.map(listing => listing._id));
    const userIds = new Set(integrationUsers.map(user => user.id));

    integrationFavorites.forEach(favorite => {
      expect(userIds.has(favorite.userId)).toBe(true);
      expect(listingIds.has(favorite.listingId)).toBe(true);
    });
  });

  it('links reviews to valid users and listings', () => {
    const listingIds = new Set(integrationListings.map(listing => listing._id));
    const userIds = new Set(integrationUsers.map(user => user.id));

    integrationReviews.forEach(review => {
      expect(userIds.has(review.userId)).toBe(true);
      expect(listingIds.has(review.listingId)).toBe(true);
      expect(review.user).toBeDefined();
      expect(review.user?.name).toBeTruthy();
    });
  });

  it('associates cities with the listings they contain', () => {
    const listingIds = new Set(integrationListings.map(listing => listing._id));

    integrationCities.forEach(city => {
      city.listingIds.forEach(listingId => {
        expect(listingIds.has(listingId)).toBe(true);
      });
    });
  });
});
