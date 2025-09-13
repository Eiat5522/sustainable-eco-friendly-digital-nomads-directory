import type { CityDTO, ListingSummaryDTO } from '@/types/dto';

export const mockCity: CityDTO = {
  id: 'bangkok',
  name: 'Bangkok',
  slug: 'bangkok',
  country: 'Thailand',
  sustainabilityScore: 72 as unknown as import('@/types/dto').Percentage0To100,
  highlights: ['Green rooftops', 'Bike lanes', 'River taxis'],
  imageUrl:
    '/placeholder_image.png',
  description: 'A vibrant city embracing sustainability initiatives.',
};

export const mockCityListings: ListingSummaryDTO[] = [
  {
    id: 'green-cowork-bangkok',
    name: 'Green Cowork Bangkok',
    slug: 'green-cowork-bangkok',
    type: 'coworking',
    city: mockCity,
    imageUrl:
      '/placeholder_image.png',
    ecoFocusTags: ['Solar Powered', 'Recycling'],
    digitalNomadFeatures: ['Fast WiFi', 'Ergonomic Chairs'],
    priceRange: 'moderate',
    website: 'https://example.com',
    address: '123 Eco Street, Bangkok',
  },
  {
    id: 'eco-cafe-bangkok',
    name: 'Eco Cafe Bangkok',
    slug: 'eco-cafe-bangkok',
    type: 'cafe',
    city: mockCity,
    imageUrl:
      '/placeholder_image.png',
    ecoFocusTags: ['Organic', 'Zero Waste'],
    digitalNomadFeatures: ['Power Outlets', 'Quiet Corners'],
    priceRange: 'budget',
    website: 'https://example.com',
    address: '456 Green Ave, Bangkok',
  },
];
