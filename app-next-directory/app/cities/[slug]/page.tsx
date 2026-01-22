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

export default async function CityPage({ params }: Props) {
  // Next.js 15+ requires params to be awaited
  const { slug } = await params;

  // Handle E2E test fixtures
  if (isE2ETest) {
    const fixture = e2eCityFixtures[slug];
    if (fixture) {
      return (
        <>
          <Header />
          <main>
            <CityDetailView city={fixture.city} listings={fixture.listings} />
          </main>
          <Footer />
        </>
      );
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
    return (
      <>
        <Header />
        <main>
          <CityDetailView city={fallbackCity} listings={[]} />
        </main>
        <Footer />
      </>
    );
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
      return (
        <>
          <Header />
          <main>
            <CityDetailView city={makeFallbackCity(slug)} listings={[]} />
          </main>
          <Footer />
        </>
      );
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

  return (
    <>
      <Header />
      <main>
        <CityDetailView city={city} listings={listings} />
      </main>
      <Footer />
    </>
  );
}
