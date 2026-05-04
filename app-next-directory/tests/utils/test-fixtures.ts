import { test as base } from '@playwright/test';
import { type Listing } from '@/types/listings';

type ListingsFixtures = {
  mockListings: Listing[];
  defaultFilters: {
    categories: string[];
    ecoTags: string[];
  };
};

export const test = base.extend<ListingsFixtures>({
  mockListings: async ({ browserName }, use) => {
    const mockData: Listing[] = [
      {
        id: '1',
        name: 'Test Coworking',
        city: 'Bangkok',
        category: 'coworking',
        address_string: '123 Test St',
        coordinates: {
          latitude: 13.7563,
          longitude: 100.5018
        },
        description_short: 'Test description',
        description_long: 'Long description',
        eco_focus_tags: ['zero-waste'],
        eco_notes_detailed: 'Eco notes',
        source_urls: [],
        primary_image_url: '/test.jpg',
        gallery_image_urls: [],
        digital_nomad_features: ['wifi'],
        last_verified_date: '2025-05-14'
      }
    ];
    await use(mockData);
  },

  defaultFilters: async ({ browserName }, use) => {
    await use({
      categories: ['coworking', 'cafe', 'accommodation'],
      ecoTags: [
        'zero-waste',
        'renewable-energy',
        'plant-based',
        'eco-construction',
        'water-conservation',
        'local-community',
        'organic'
      ]
    });
  }
});
