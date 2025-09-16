import { CityDetailView } from '@/components/city/CityDetailView';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { getCityBySlug, getCityDetailBySlug, getListingsByCityId } from '@/lib/data/city';
import type { CityDTO, CityDetailDTO, ListingSummaryDTO } from '@/types/dto';
import { CityDTOSchema, CityDetailDTOSchema, ListingSummaryDTOArraySchema } from '@/types/dto-schemas';
import { structuredLogger } from '@/lib/logger';

export const revalidate = 300;

type Params = { slug: string };
type Props = { params: Params | Promise<Params> };

const toTitleCaseFromSlug = (s: string) =>
   s.replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    // Optionally handle common acronyms
    .replace(/\b(nyc|usa|uk|eu)\b/gi, (match) => match.toUpperCase());

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

/**
 * Helper to sanitize Error objects for logging, removing sensitive properties
 */
const sanitizeErrorForLogging = (error: unknown): any => {
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
  // Support Next 14 (value) and Next 15 (promise) params
  const { slug } = await Promise.resolve(params);

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
      // Note: slug is safe to log as it's public URL parameter
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
    city = detailResult.data;
  } else {
    const basicResult = CityDTOSchema.safeParse(rawCity);
    if (basicResult.success) {
      city = basicResult.data;
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
      listings = listingsResult.data;
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
