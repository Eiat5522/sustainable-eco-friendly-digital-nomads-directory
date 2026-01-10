import { test as base } from '@playwright/test';
import { createTestData, listEcoTags } from '@tests/helpers/test-data';
import type { Listing } from '@/types/listings';

type ListingsFixtures = {
  mockListings: Listing[];
  defaultFilters: {
    categories: string[];
    ecoTags: string[];
  };
};

export const test = base.extend<ListingsFixtures>({
  mockListings: async (_fixtures, runFixture) => {
    const { listings } = createTestData();
    await runFixture(listings);
  },

  defaultFilters: async (_fixtures, runFixture) => {
    const data = createTestData();
    const categories = Array.from(new Set(data.listings.map(listing => listing.type)));
    const ecoTags = listEcoTags().map(tag => tag.slug.current);
    await runFixture({
      categories,
      ecoTags,
    });
  },
});
