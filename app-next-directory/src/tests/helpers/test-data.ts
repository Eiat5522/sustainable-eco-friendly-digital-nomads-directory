// Mock listing data for testing
export const mockListings = [
  {
    id: 'test-1',
    name: 'Test Coworking Space',
    city: 'Bangkok',
    category: 'coworking',
    
    eco_focus_tags: ['solar_power', 'waste_reduction'],
    digital_nomad_features: ['fast_wifi', 'quiet_work_zones'],
    slug: { current: 'test-coworking-space' },
    shortDescription: 'Solar panels and waste reduction initiatives.',
  },
  {
    id: 'test-2',
    name: 'Test Eco Cafe',
    city: 'Chiang Mai',
    category: 'cafe',
    
    eco_focus_tags: ['organic_food', 'plastic_free_initiatives'],
    digital_nomad_features: ['reliable_wifi', 'power_outlets_abundant'],
    slug: { current: 'test-eco-cafe' },
    shortDescription: 'Organic food and plastic-free initiatives.',
  },
];

// Mock city data for testing
export const mockCities = [
  {
    id: 'city-1',
    name: 'Bangkok',
    slug: 'bangkok',
    description: 'Test description for Bangkok',
  },
  {
    id: 'city-2',
    name: 'Chiang Mai',
    slug: 'chiang-mai',
    description: 'Test description for Chiang Mai',
  },
];
