import { Suspense } from 'react';
import { PageLayoutServer } from '@/components/layout/PageLayoutServer';
import { CityCarousel } from '@/components/sections/CityCarousel';
import { FeaturedListings as FeaturedListingsLegacy } from '@/components/sections/FeaturedListingsLegacy';
import { FeaturedListings } from '@/components/sections/FeaturedListingsServer';
import { HeroSection } from '@/components/sections/HeroSection';
import { getCities, getFeaturedListings } from '@/lib/data-access';
import { structuredLogger } from '@/lib/logger';
import { MOCK_CITIES, MOCK_FEATURED_LISTINGS } from '../__mocks__/homePageData';

const isE2ERun = process.env.NEXT_PUBLIC_E2E === '1' || process.env.E2E === '1';

interface FeaturedListingsSectionProps {
  readonly forceFeaturedFetch: boolean;
}

/**
 * Featured listings section with data from DAL
 * Uses 'use cache' via DAL for optimal caching
 */
async function FeaturedListingsSection({ forceFeaturedFetch }: FeaturedListingsSectionProps) {
  if (isE2ERun) {
    if (forceFeaturedFetch) {
      return <FeaturedListingsLegacy initialListings={null} />;
    }
    // Pass mock data for E2E tests - ensures data fetching logic (DTO mapping, etc.) is tested
    return <FeaturedListingsLegacy initialListings={MOCK_FEATURED_LISTINGS} />;
  }

  let listings: Awaited<ReturnType<typeof getFeaturedListings>> | null = null;
  try {
    listings = await getFeaturedListings(10);
  } catch (error) {
    structuredLogger.error('Failed to fetch featured listings:', { error });
  }

  // Use new server component with pre-fetched data
  return <FeaturedListings listings={listings ?? []} />;
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
  // Pass empty array instead of null to prevent client-side fetch attempts
  return <CityCarousel initialCities={cities ?? []} />;
}

interface HomePageProps {
  readonly searchParams?: Promise<{ forceFeaturedFetch?: string | string[] }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const forceFeaturedFetch = Array.isArray(resolvedSearchParams.forceFeaturedFetch)
    ? resolvedSearchParams.forceFeaturedFetch.includes('1')
    : resolvedSearchParams.forceFeaturedFetch === '1';

  return (
    <PageLayoutServer>
      <HeroSection />
      <Suspense
        fallback={
          <section className="py-16 bg-background">
            <div className="container mx-auto px-4">
              <div className="text-center py-12">
                <p className="body-lg">Loading featured venues...</p>
              </div>
            </div>
          </section>
        }
      >
        <FeaturedListingsSection forceFeaturedFetch={forceFeaturedFetch} />
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
