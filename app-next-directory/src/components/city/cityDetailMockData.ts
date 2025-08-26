import type { CityDTO, ListingSummaryDTO } from '@/types/dto';

export const mockCity: CityDTO = {
  id: 'bangkok',
  name: 'Bangkok',
  slug: 'bangkok',
  country: 'Thailand',
  sustainabilityScore: 72,
  highlights: ['Green rooftops', 'Bike lanes', 'River taxis'],
  imageUrl:
    'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',
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
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80',
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
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
    ecoFocusTags: ['Organic', 'Zero Waste'],
    digitalNomadFeatures: ['Power Outlets', 'Quiet Corners'],
    priceRange: 'budget',
    website: 'https://example.com',
    address: '456 Green Ave, Bangkok',
  },
];
