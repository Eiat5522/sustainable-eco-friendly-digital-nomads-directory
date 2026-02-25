import { connection } from 'next/server';
import { Suspense } from 'react';
import { CityDetailView } from '@/components/city/CityDetailView';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import {
  getAllCitySlugs,
  getCityBySlug,
  getCityDetailBySlug,
  getListingsByCityId,
} from '@/lib/data-access/cities.dal';
import { structuredLogger } from '@/lib/logger';
import type { CityDetailDTO, CityDTO, ListingSummaryDTO } from '@/types/dto';
import {
  CityDetailDTOSchema,
  CityDTOSchema,
  ListingSummaryDTOArraySchema,
} from '@/types/dto-schemas';

type Params = { slug: string };
type Props = { params: Params | Promise<Params> };

/**
 * Generate static params for all city pages
 * This enables static generation at build time for better performance
 */
export async function generateStaticParams(): Promise<Params[]> {
  try {
    const slugs = await getAllCitySlugs();
    if (!Array.isArray(slugs) || slugs.length === 0) {
      // Ensure at least one param is returned for Cache Components validation.
      return [{ slug: 'empty-city' }];
    }
    return slugs.map(slug => ({ slug }));
  } catch (error) {
    structuredLogger.error('Failed to generate static params for city pages', error, {
      component: 'city-page',
      operation: 'generateStaticParams',
    });
    // Return a safe fallback param so build-time validation can proceed.
    // With Cache Components enabled, Next requires at least one param.
    // The page gracefully renders a fallback city when data is missing.
    return [{ slug: 'empty-city' }];
  }
}

const toTitleCaseFromSlug = (s: string) =>
  s
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    // Optionally handle common acronyms
    .replace(/\b(nyc|usa|uk|eu)\b/gi, match => match.toUpperCase());

const makeFallbackCity = (slug: string): CityDTO => ({
  id: `city-${slug}`,
  name: toTitleCaseFromSlug(slug),
  slug,
  country: 'Unknown',
  highlights: [],
  imageUrl: null,
  imageDimensions: null,
  description: 'Preview data: city details unavailable.',
});

const isE2ETest = process.env.NEXT_PUBLIC_E2E === '1' || process.env.E2E === '1';

const e2eCityFixtures: Record<
  string,
  { city: CityDTO | CityDetailDTO; listings: ListingSummaryDTO[] }
> = isE2ETest
  ? {
      bangkok: {
        city: {
          id: 'city-bangkok',
          name: 'Bangkok',
          slug: 'bangkok',
          country: 'Thailand',
          sustainabilityScore: 72 as CityDetailDTO['sustainabilityScore'],
          highlights: ['Green rooftops', 'Bike lanes', 'River taxis'],
          imageUrl: '/placeholder_image.png',
          imageDimensions: null,
          description:
            'Bangkok is embracing sustainability through green rooftops, river revitalisation, and low-carbon mobility.',
          shortDescription: 'High-energy capital with a growing network of sustainable work hubs.',
          airQuality: 'Variable — improving during cooler seasons',
          internetSpeed: 250,
          costOfLiving: 'Moderate',
          climate: 'Tropical',
          safety: 'Generally safe with vibrant expat communities',
          walkability: 'High in core neighbourhoods',
          sustainabilityInitiatives: [
            'Solar rooftops for coworking hubs',
            'Expanded urban rail network',
            'Community recycling drives',
          ],
          digitalNomadFeatures: ['Abundant coworking spaces', 'Night markets', 'Riverfront cafes'],
          galleryImages: [],
        },
        listings: [
          {
            id: 'listing-green-cowork-bangkok',
            name: 'Green Cowork Bangkok',
            slug: 'green-cowork-bangkok',
            type: 'coworking',
            city: {
              id: 'city-bangkok',
              name: 'Bangkok',
              slug: 'bangkok',
              country: 'Thailand',
            },
            imageUrl: '/placeholder_image.png',
            ecoFocusTags: ['Solar Powered', 'Zero Waste'],
            digitalNomadFeatures: ['Fast WiFi', '24/7 Access'],
            priceRange: 'moderate',
            amenityNames: ['Fast WiFi', 'Quiet Zones', 'Solar Powered'],
            shortDescription: 'A leafy coworking hub focused on renewable energy.',
          },
        ],
      },
      testopolis: {
        city: {
          id: 'city-testopolis',
          name: 'Testopolis',
          slug: 'testopolis',
          country: 'Testland',
          sustainabilityScore: 78 as CityDetailDTO['sustainabilityScore'],
          highlights: ['Green rooftops', 'Bike sharing', 'River taxis'],
          imageUrl: '/placeholder_image.png',
          imageDimensions: null,
          description: 'Testopolis balances sustainability with vibrant urban life.',
          shortDescription: 'Concise overview of Testopolis metrics.',
          internetSpeed: { download: 120, upload: 40 },
          costOfLiving: 'Affordable (index 68)',
          climate: 'Tropical with mild winters',
          safety: 'Very safe for visitors',
          walkability: 'Excellent pedestrian network',
          airQuality: 'Good (AQI 45)',
          sustainabilityInitiatives: ['Solar rooftops', 'Zero waste markets'],
          digitalNomadFeatures: ['Community events', 'Coworking passes'],
          galleryImages: [],
        },
        listings: [
          {
            id: 'listing-eco-hub',
            name: 'Eco Hub Workspace',
            slug: 'eco-hub-workspace',
            type: 'coworking',
            city: {
              id: 'city-testopolis',
              name: 'Testopolis',
              slug: 'testopolis',
              country: 'Testland',
            },
            imageUrl: '/placeholder_image.png',
            ecoFocusTags: ['Solar Powered', 'Zero Waste'],
            digitalNomadFeatures: ['Fast WiFi'],
            priceRange: 'moderate',
            amenityNames: ['Fast WiFi', 'Private Rooms'],
            shortDescription: 'A bright workspace for digital nomads.',
          },
          {
            id: 'listing-green-stay',
            name: 'Green Stay Apartments',
            slug: 'green-stay-apartments',
            type: 'accommodation',
            city: {
              id: 'city-testopolis',
              name: 'Testopolis',
              slug: 'testopolis',
              country: 'Testland',
            },
            imageUrl: '/placeholder_image.png',
            ecoFocusTags: ['Rainwater Harvesting'],
            digitalNomadFeatures: ['In-room desks'],
            priceRange: 'premium',
            amenityNames: ['Gym Access'],
            shortDescription: 'Eco-forward apartments for extended stays.',
          },
        ],
      },
      'empty-city': {
        city: makeFallbackCity('empty-city'),
        listings: [],
      },
    }
  : {};

/**
 * Helper to sanitize Error objects for logging, removing sensitive properties
 */
const sanitizeErrorForLogging = (error: unknown): unknown => {
  if (!error) return null;

  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
    };
  }

  // For non-Error objects, convert to string safely
  return {
    message: String(error),
    type: typeof error,
  };
};

/**
 * Separate component for fetching city data
 * This allows Suspense to handle the loading state at a granular level
 */
export async function CityContent({ slug }: { slug: string }) {
  // Access connection() first to opt-in to dynamic rendering before any logging
  // This prevents Date.now() errors during prerendering
  await connection();

  // Handle E2E test fixtures
  if (isE2ETest) {
    const fixture = e2eCityFixtures[slug];
    if (fixture) {
      return <CityDetailView city={fixture.city} listings={fixture.listings} />;
    }
  }

  // Prefer detailed city data; fall back to basic data and guard exceptions
  let rawCity: unknown = null;
  try {
    rawCity = await getCityDetailBySlug(slug);
    if (!rawCity) rawCity = await getCityBySlug(slug);
  } catch (err) {
    structuredLogger.error('City fetch failed', sanitizeErrorForLogging(err), {
      component: 'city-page',
      operation: 'fetch_city_data',
      slug: slug,
    });
  }

  if (!rawCity) {
    const fallbackCity = makeFallbackCity(slug);
    return <CityDetailView city={fallbackCity} listings={[]} />;
  }

  // Validate using schema-first approach (detail → basic)
  const detailResult = CityDetailDTOSchema.safeParse(rawCity);
  let city: CityDTO | CityDetailDTO;
  if (detailResult.success) {
    city = detailResult.data as CityDetailDTO;
  } else {
    const basicResult = CityDTOSchema.safeParse(rawCity);
    if (basicResult.success) {
      city = basicResult.data as CityDTO;
    } else {
      structuredLogger.error('Invalid city DTO validation failed', null, {
        component: 'city-page',
        operation: 'validate_city_dto',
        slug: slug,
        validationErrors: {
          detailError: detailResult.error.message,
          basicError: basicResult.error.message,
        },
      });
      return <CityDetailView city={makeFallbackCity(slug)} listings={[]} />;
    }
  }

  // Only fetch listings when city validation passes
  let listings: ListingSummaryDTO[] = [];
  try {
    const rawListings: unknown = await getListingsByCityId(city.id);
    const listingsResult = ListingSummaryDTOArraySchema.safeParse(rawListings);
    if (!listingsResult.success) {
      structuredLogger.error('Invalid ListingSummaryDTO validation failed', null, {
        component: 'city-page',
        operation: 'validate_listings_dto',
        cityId: city.id,
        slug: slug,
        validationError: listingsResult.error.message,
      });
    } else {
      listings = listingsResult.data as ListingSummaryDTO[];
    }
  } catch (err) {
    structuredLogger.error('Listings fetch failed', sanitizeErrorForLogging(err), {
      component: 'city-page',
      operation: 'fetch_city_listings',
      cityId: city.id,
      slug: slug,
    });
  }

  return <CityDetailView city={city} listings={listings} />;
}

/**
 * Loading fallback component for city content
 */
function CityLoadingFallback() {
  return (
    <div className="relative overflow-hidden bg-neo-secondary px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-25"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, var(--neo-border) 2px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="container relative z-10 mx-auto max-w-4xl">
        <div
          className="border-4 border-neo-border bg-neo-surface p-10 text-center"
          style={{ boxShadow: '12px 12px 0px 0px var(--neo-shadow)' }}
        >
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
            role="status"
          >
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
              Loading...
            </span>
          </div>
          <p className="mt-4 text-sm text-gray-600">Loading city information...</p>
        </div>
      </div>
    </div>
  );
}

export default async function CityPage({ params }: Props) {
  const { slug } = await params;

  return (
    <>
      <Suspense fallback={<div className="h-16 bg-gray-100 animate-pulse" />}>
        <Header />
      </Suspense>
      <main className="relative overflow-hidden bg-neo-secondary">
        <Suspense fallback={<CityLoadingFallback />}>
          <CityContent slug={slug} />
        </Suspense>
      </main>
      <Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse" />}>
        <Footer />
      </Suspense>
    </>
  );
}
