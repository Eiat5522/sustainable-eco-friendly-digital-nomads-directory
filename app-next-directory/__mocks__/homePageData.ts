import type { CityDTO, FeaturedListingDTO, Percentage0To100 } from '@/types/dto';

// Mock data for E2E tests - ensures data fetching logic is tested
export const MOCK_FEATURED_LISTINGS: FeaturedListingDTO[] = [
  {
    id: 'e2e-mock-listing-1',
    name: 'Eco Haven Co-working',
    slug: 'eco-haven-co-working',
    imageUrl: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800',
    city: 'Bali',
    amenityNames: ['Solar Power', 'Zero Waste', 'Organic Food'],
  },
  {
    id: 'e2e-mock-listing-2',
    name: 'Green Office Barcelona',
    slug: 'green-office-barcelona',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    city: 'Barcelona',
    amenityNames: ['Carbon Neutral', 'Recycling Program'],
  },
  {
    id: 'e2e-mock-listing-3',
    name: 'Sustainable Hub Chiang Mai',
    slug: 'sustainable-hub-chiang-mai',
    imageUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800',
    city: 'Chiang Mai',
    amenityNames: ['Community Garden', 'Plastic Free'],
  },
];

export const MOCK_CITIES: CityDTO[] = [
  {
    id: 'e2e-mock-city-1',
    name: 'Bali',
    slug: 'bali',
    country: 'Indonesia',
    description: 'Tropical paradise with thriving digital nomad community',
    sustainabilityScore: Number(85) as Percentage0To100,
    highlights: ['Eco-friendly villas', 'Organic food scene', 'Renewable energy initiatives'],
    imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
  },
  {
    id: 'e2e-mock-city-2',
    name: 'Barcelona',
    slug: 'barcelona',
    country: 'Spain',
    description: 'Vibrant city with strong sustainability focus',
    sustainabilityScore: Number(78) as Percentage0To100,
    highlights: ['Bike-friendly', 'Solar projects', 'Zero waste stores'],
    imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
  },
  {
    id: 'e2e-mock-city-3',
    name: 'Chiang Mai',
    slug: 'chiang-mai',
    country: 'Thailand',
    description: 'Cultural hub with affordable sustainable living',
    sustainabilityScore: Number(72) as Percentage0To100,
    highlights: ['Coworking spaces', 'Local crafts', 'Plant-based restaurants'],
    imageUrl: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800',
  },
];
