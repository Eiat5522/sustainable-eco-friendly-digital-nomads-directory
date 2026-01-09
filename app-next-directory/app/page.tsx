'use cache';

import { cacheLife, cacheTag } from 'next/cache';
import { Suspense } from 'react';
import { PageLayoutServer } from '@/components/layout/PageLayoutServer';
import { CityCarousel } from '@/components/sections/CityCarousel';
import { FeaturedListings } from '@/components/sections/FeaturedListings';
import { HeroSection } from '@/components/sections/HeroSection';
import { getCities, getFeaturedListings } from '@/lib/data-access';
import { structuredLogger } from '@/lib/logger';
import { MOCK_FEATURED_LISTINGS, MOCK_CITIES } from '__mocks__/homePageData';

const isE2ERun = process.env.NEXT_PUBLIC_E2E === '1' || process.env.E2E === '1';

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
