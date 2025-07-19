import { type Listing } from '@/types/listings';

export const mockListings: Listing[] = [
  {
    id: '1',
    name: 'Eco-Friendly Coworking Space',
    description_short: 'A sustainable coworking space with solar panels and recycling',
    category: 'coworking',
    address_string: '123 Green Street, Bangkok',
    eco_focus_tags: ['solar_powered', 'zero_waste', 'recycling_program'],
    digital_nomad_features: ['high_speed_wifi', 'meeting_rooms'],
    primary_image_url: '/images/sample/coworking.jpg',
    city: 'Bangkok',
    description_long: '',
    eco_notes_detailed: '',
    source_urls: [],
    gallery_image_urls: [],
    last_verified_date: ''
  },
  {
      id: '2',
      name: 'Bamboo Eco Café',
      description_short: 'Eco-conscious café serving local organic produce and using eco-friendly practices',
      description_long: 'A spacious, eco-friendly café in Chiang Mai focused on sustainability, offering organic food and a welcoming atmosphere for digital nomads.',
      category: 'cafe',
      address_string: '456 Bamboo Lane, Chiang Mai',
      eco_focus_tags: ['organic_food', 'local_sourcing', 'plastic_free'],
      eco_notes_detailed: 'Uses bamboo furniture, composts waste, and sources ingredients locally.',
      source_urls: ['https://bambooecocafe.example.com'],
      primary_image_url: '/images/sample/cafe.jpg',
      gallery_image_urls: ['/images/sample/cafe1.jpg', '/images/sample/cafe2.jpg'],
      digital_nomad_features: ['wifi_available', 'power_outlets'],
      last_verified_date: '2025-07-01',
      city: 'Chiang Mai'
    }
];

export async function setupTestData() {
  // This would be used to insert test data into a test database
  // For now, we'll just use the mock data directly in tests
  return mockListings;
}
