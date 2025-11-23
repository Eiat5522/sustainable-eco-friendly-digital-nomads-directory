import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const baseData = {
  listings: [{ id: 'listing-1' }],
  users: [{ id: 'user-1' }],
  cities: [{ id: 'city-1' }],
  favorites: [{ id: 'favorite-1' }],
  reviews: [{ id: 'review-1' }],
  ecoTags: [],
};

const secondData = {
  listings: [{ id: 'listing-2' }],
  users: [{ id: 'user-2' }],
  cities: [{ id: 'city-2' }],
  favorites: [{ id: 'favorite-2' }],
  reviews: [{ id: 'review-2' }],
  ecoTags: [],
};

jest.mock('@/tests/helpers/test-data', () => ({
  createTestData: jest.fn(() => ({ ...baseData })),
}));

describe('tests/fixtures/index', () => {
  const { createTestData } = jest.requireMock('@/tests/helpers/test-data') as {
    createTestData: jest.MockedFunction<() => typeof baseData>;
  };

  beforeEach(() => {
    createTestData.mockClear();
    createTestData.mockImplementation(() => ({ ...baseData }));
  });

  it('creates integration test data once and exposes derived collections', async () => {
    await jest.isolateModulesAsync(async () => {
      const fixtures = await import('./index');

      expect(createTestData).toHaveBeenCalledTimes(1);
      expect(fixtures.integrationTestData).toMatchObject(baseData);
      expect(fixtures.integrationListings).toBe(fixtures.integrationTestData.listings);
      expect(fixtures.integrationUsers).toBe(fixtures.integrationTestData.users);
      expect(fixtures.integrationCities).toBe(fixtures.integrationTestData.cities);
      expect(fixtures.integrationFavorites).toBe(fixtures.integrationTestData.favorites);
      expect(fixtures.integrationReviews).toBe(fixtures.integrationTestData.reviews);
    });
  });

  it('reinitialises integration fixtures when the module graph is re-evaluated', async () => {
    createTestData
      .mockImplementationOnce(() => ({ ...baseData }))
      .mockImplementationOnce(() => ({ ...secondData }));

    await jest.isolateModulesAsync(async () => {
      const first = await import('./index');
      expect(first.integrationTestData.listings[0]).toEqual(baseData.listings[0]);
    });

    await jest.isolateModulesAsync(async () => {
      const second = await import('./index');
      expect(second.integrationTestData.listings[0]).toEqual(secondData.listings[0]);
    });

    expect(createTestData).toHaveBeenCalledTimes(2);
  });
});
