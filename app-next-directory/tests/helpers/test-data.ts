import { type Listing } from '@/types/listings';

export const mockListings: Listing[] = [
  {
    _id: '1',
    name: 'Eco-Friendly Coworking Space',
    shortDescription: 'A sustainable coworking space with solar panels and recycling',
    type: 'coworking',
    address: '123 Green Street, Bangkok',
    ecoTags: ['solar_powered', 'zero_waste', 'recycling_program'],
    digitalNomadFeatures: ['high_speed_wifi', 'meeting_rooms'],
    mainImage: '/images/sample/coworking.jpg',
    city: { name: 'Bangkok', slug: 'bangkok' },
    longDescription: '',
    ecoNotesDetailed: '',
    sourceUrls: [],
    galleryImageurls: [],
    lastVerifiedDate: ''
  },
  {
      _id: '2',
      name: 'Bamboo Eco Café',
      shortDescription: 'Eco-conscious café serving local organic produce and using eco-friendly practices',
      longDescription: 'A spacious, eco-friendly café in Chiang Mai focused on sustainability, offering organic food and a welcoming atmosphere for digital nomads.',
      type: 'cafe',
      address: '456 Bamboo Lane, Chiang Mai',
      ecoTags: ['organic_food', 'local_sourcing', 'plastic_free'],
      ecoNotesDetailed: 'Uses bamboo furniture, composts waste, and sources ingredients locally.',
      sourceUrls: ['https://bambooecocafe.example.com'],
      primarImage: '/images/sample/cafe.jpg',
      galleryImage: ['/images/sample/cafe1.jpg', '/images/sample/cafe2.jpg'],
      digitalNomadFeatures: ['wifi_available', 'power_outlets'],
      lastVerifiedDate: '2025-07-01',
      city: { name: 'Chiang Mai', slug: 'chiangmai' },
    }
];

export async function setupTestData() {
  // This would be used to insert test data into a test database
  // For now, we'll just use the mock data directly in tests
  return mockListings;
}
