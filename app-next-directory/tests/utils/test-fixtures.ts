import { test as base } from '@playwright/test';
import { type Listing } from '@/types/listings';

type ListingsFixtures = {
  mockListings: Listing[];
  defaultFilters: {
    categories: string[];
    ecoTags: string[];
  };
};

// Extend base test with fixtures
export const test = base.extend<ListingsFixtures>({
  mockListings: async ({}, use) => {
    // Provide mock listings data
    const mockData: Listing[] = [
      {
        _id: '1',
        name: 'Test Coworking',
        city: { name: 'Bangkok', slug: { current: 'bangkok' } },
        type: 'coworking',
        address: '123 Test St',
        coordinates: {
          latitude: 13.7563,
          longitude: 100.5018
        },
        longDescription: 'Long description',
        ecoTags: [{ _id: '1', name: 'zero-waste', slug: { current: 'zero-waste' }, description: 'Zero waste practices' }],
        shortDescription: 'Eco notes', //map to ecoNotesDetailed for data migration
        sourceUrls: [],
        mainImage: '/test.jpg',
        galleryImages: [],
        digitalNomadFeatures: ['wifi'],
        lastVerifiedDate: '2025-05-14',
        ecoDetails: {
          description: 'Eco-friendly practices',
          ecoTags: ['zero-waste'],
          certifications: ['LEED Gold']
        }
      }
      // Add more mock listings as needed
    ];

    await use(mockData);
  },

  defaultFilters: async ({}, use) => {
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
