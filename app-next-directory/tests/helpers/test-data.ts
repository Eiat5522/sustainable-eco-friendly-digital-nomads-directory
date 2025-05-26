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
    country: 'Thailand'
  },
  {
    id: '2',
    name: 'Bamboo Eco Café',
    description_short: 'Eco-conscious café serving local organic produce and using eco-friendly practices',
    category: 'cafe',
    address_string: '456 Bamboo Lane, Chiang Mai',
    eco_focus_tags: ['organic_food', 'local_sourcing', 'plastic_free'],
    digital_nomad_features: ['wifi_available', 'power_outlets'],
    primary_image_url: '/images/sample/cafe.jpg',
    city: 'Chiang Mai',
    country: 'Thailand'
  }
];

export async function setupTestData() {
  // This would be used to insert test data into a test database
  // For now, we'll just use the mock data directly in tests
  return mockListings;
}
