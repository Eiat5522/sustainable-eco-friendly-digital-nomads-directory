import { type Listing } from '@/types/listing';
import { ListingCategory } from '@/types/enums';

export const mockListings: Listing[] = [
  {
    _id: '1',
    name: 'Eco-Friendly Coworking Space',
    slug: { current: 'eco-friendly-coworking-space' },
    shortDescription: 'A sustainable coworking space with solar panels and recycling',
    type: ListingCategory.COWORKING,
    address: '123 Green Street, Bangkok',
    ecoTags: [], // Use valid EcoTag enum values if available
    digitalNomadFeatures: ['high_speed_wifi', 'meeting_rooms'],
    mainImage: { asset: { _ref: '', url: '/images/sample/coworking.jpg' } },
    city: { _id: 'bangkok', name: 'Bangkok', slug: { current: 'bangkok' }, listingCount: 0, country: 'Thailand' },
    longDescription: '',
    sourceUrls: [],
    galleryImages: [],
    updatedAt: ''
  },
  {
      _id: '2',
      name: 'Bamboo Eco Café',
      slug: { current: 'bamboo-eco-cafe' },
      shortDescription: 'Eco-conscious café serving local organic produce and using eco-friendly practices',
      longDescription: 'A spacious, eco-friendly café in Chiang Mai focused on sustainability, offering organic food and a welcoming atmosphere for digital nomads.',
      type: ListingCategory.CAFE,
      address: '456 Bamboo Lane, Chiang Mai',
      ecoTags: [], // Use valid EcoTag enum values if available
      sourceUrls: ['https://bambooecocafe.example.com'],
      mainImage: { asset: { _ref: '', url: '/images/sample/cafe.jpg' } },
      galleryImages: [
        { asset: { _ref: '', url: '/images/sample/cafe1.jpg' } },
        { asset: { _ref: '', url: '/images/sample/cafe2.jpg' } }
      ],
      digitalNomadFeatures: ['wifi_available', 'power_outlets'],
      updatedAt: '2025-07-01',
      city: { _id: 'chiangmai', name: 'Chiang Mai', slug: { current: 'chiangmai' }, listingCount: 0, country: 'Thailand' },
    }
];

export async function setupTestData() {
  // This would be used to insert test data into a test database
  // For now, we'll just use the mock data directly in tests
  return mockListings;
}
