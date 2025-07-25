import { test as setup } from '@playwright/test';

const mockListings = [
  {
    id: '1',
    name: 'Eco Coworking Hub',
    city: 'Bangkok',
    category: 'coworking',
    addressString: '123 Green Street, Bangkok',
    coordinates: {
      latitude: 13.7563,
      longitude: 100.5018
    },
    shortDescription: 'Solar-powered coworking space with zero-waste policy',
    longDescription: 'Full description...',
    ecoTags: ['zero-waste', 'renewable-energy'],
    ecoNotesDetailed: 'Detailed eco notes...',
    sourceUrls: ['https://example.com'],
    primary_image_url: '/images/eco-hub.jpg',
    gallery_image_urls: [],
    digitalNomadFeatures: ['high-speed-wifi', 'meeting-rooms'],
    lastVerifiedDate: '2025-05-01'
  },
  {
    id: '2',
    name: 'Green Cafe',
    city: 'Bangkok',
    category: 'cafe',
    addressString: '456 Eco Road, Bangkok',
    coordinates: {
      latitude: 13.7584,
      longitude: 100.5066
    },
    shortDescription: 'Organic cafe with plant-based options',
    longDescription: 'Full description...',
    ecoTags: ['organic', 'plant-based'],
    ecoNotesDetailed: 'Detailed eco notes...',
    sourceUrls: ['https://example.com'],
    primary_image_url: '/images/green-cafe.jpg',
    gallery_image_urls: [],
    digitalNomadFeatures: ['wifi', 'power-outlets'],
    lastVerifiedDate: '2025-05-01'
  }
];

export async function globalSetup(/* config */) {
  // You can also add other global setup logic here
  return {
    mockListings
  };
}

export default setup('mock listings data', async ({ page }) => {
  // Mock the legacy listings API response
  await page.route('/api/legacy-listings', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: mockListings
      })
    });
  });
});
