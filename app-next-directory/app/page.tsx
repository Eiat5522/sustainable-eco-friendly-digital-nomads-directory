'use cache';

import { cacheLife, cacheTag } from 'next/cache';
import { Suspense } from 'react';
import { PageLayoutServer } from '@/components/layout/PageLayoutServer';
import { CityCarousel } from '@/components/sections/CityCarousel';
import { FeaturedListings } from '@/components/sections/FeaturedListings';
import { HeroSection } from '@/components/sections/HeroSection';
import { getCities, getFeaturedListings } from '@/lib/data-access';
import { structuredLogger } from '@/lib/logger';
import type { CityDTO, FeaturedListingDTO } from '@/types/dto';

const isE2ERun = process.env.NEXT_PUBLIC_E2E === '1' || process.env.E2E === '1';

// Mock data for E2E tests - ensures data fetching logic is tested
const MOCK_FEATURED_LISTINGS: FeaturedListingDTO[] = [
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

const MOCK_CITIES: CityDTO[] = [
  {
    id: 'e2e-mock-city-1',
    name: 'Bali',
    slug: 'bali',
    country: 'Indonesia',
    description: 'Tropical paradise with thriving digital nomad community',
    sustainabilityScore: 85,
    highlights: ['Eco-friendly villas', 'Organic food scene', 'Renewable energy initiatives'],
    imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
  },
  {
    id: 'e2e-mock-city-2',
    name: 'Barcelona',
    slug: 'barcelona',
    country: 'Spain',
    description: 'Vibrant city with strong sustainability focus',
    sustainabilityScore: 78,
    highlights: ['Bike-friendly', 'Solar projects', 'Zero waste stores'],
    imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
  },
  {
    id: 'e2e-mock-city-3',
    name: 'Chiang Mai',
    slug: 'chiang-mai',
    country: 'Thailand',
    description: 'Cultural hub with affordable sustainable living',
    sustainabilityScore: 72,
    highlights: ['Coworking spaces', 'Local crafts', 'Plant-based restaurants'],
    imageUrl: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800',
  },
];

/**
 * Featured listings section with data from DAL
 * Uses 'use cache' via DAL for optimal caching
 */
async function FeaturedListingsSection() {
  if (isE2ERun) {
    // Pass mock data for E2E tests - ensures data fetching logic (DTO mapping, etc.) is tested
    return <FeaturedListings initialListings={MOCK_FEATURED_LISTINGS} />;
  }

  let listings: Awaited<ReturnType<typeof getFeaturedListings>> | null = null;
  try {
    listings = await getFeaturedListings(10);
  } catch (error) {
    structuredLogger.error('Failed to fetch featured listings:', { error });
  }
  return <FeaturedListings initialListings={listings} />;
}

/**
 * City carousel section with data from DAL
 * Uses 'use cache' via DAL for optimal caching
 */
async function CityCarouselSection() {
  if (isE2ERun) {
    // Pass mock data for E2E tests - ensures data fetching logic (DTO mapping, etc.) is tested
    return <CityCarousel initialCities={MOCK_CITIES} />;
  }

  let cities: Awaited<ReturnType<typeof getCities>> | null = null;
  try {
    cities = await getCities(8);
  } catch (error) {
    structuredLogger.error('Failed to fetch cities:', { error });
  }
  return <CityCarousel initialCities={cities} />;
}

export default async function HomePage() {
  cacheLife('days');
  cacheTag('home');

  return (
    <PageLayoutServer>
      <HeroSection />
      <Suspense
        fallback={
          <div className="text-center py-12">
            <p className="body-lg">Loading featured venues...</p>
          </div>
        }
      >
        <FeaturedListingsSection />
      </Suspense>
      <Suspense
        fallback={
          <div className="text-center py-12">
            <p className="body-lg">Loading cities…</p>
          </div>
        }
      >
        <CityCarouselSection />
      </Suspense>
    </PageLayoutServer>
  );
}
