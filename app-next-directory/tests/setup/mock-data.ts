import { test as setup } from '@playwright/test';

const mockListings = [
  {
    id: '1',
    name: 'Eco Coworking Hub',
    city: 'Bangkok',
    category: 'coworking',
    address_string: '123 Green Street, Bangkok',
    coordinates: {
      latitude: 13.7563,
      longitude: 100.5018
    },
    description_short: 'Solar-powered coworking space with zero-waste policy',
    description_long: 'Full description...',
    eco_focus_tags: ['zero-waste', 'renewable-energy'],
    eco_notes_detailed: 'Detailed eco notes...',
    source_urls: ['https://example.com'],
    primary_image_url: '/images/eco-hub.jpg',
    gallery_image_urls: [],
    digital_nomad_features: ['high-speed-wifi', 'meeting-rooms'],
    last_verified_date: '2025-05-01'
  },
  {
    id: '2',
    name: 'Green Cafe',
    city: 'Bangkok',
    category: 'cafe',
    address_string: '456 Eco Road, Bangkok',
    coordinates: {
      latitude: 13.7584,
      longitude: 100.5066
    },
    description_short: 'Organic cafe with plant-based options',
    description_long: 'Full description...',
    eco_focus_tags: ['organic', 'plant-based'],
    eco_notes_detailed: 'Detailed eco notes...',
    source_urls: ['https://example.com'],
    primary_image_url: '/images/green-cafe.jpg',
    gallery_image_urls: [],
    digital_nomad_features: ['wifi', 'power-outlets'],
    last_verified_date: '2025-05-01'
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
