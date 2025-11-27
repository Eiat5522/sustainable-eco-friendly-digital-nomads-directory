import { Suspense } from 'react';
import { getCityBySlug, getCityDetailBySlug, getListingsByCityId } from '@/lib/data/city';
import { structuredLogger } from '@/lib/logger';
import type { CityDetailDTO, CityDTO, ListingSummaryDTO } from '@/types/dto';
import {
  CityDetailDTOSchema,
  CityDTOSchema,
  ListingSummaryDTOArraySchema,
} from '@/types/dto-schemas';
import ClientCityDetailViewWrapper from './ClientCityDetailViewWrapper'; // Import the new wrapper

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

export async function CityDetail({ slug }: { slug: string }) {
  // Prefer detailed city data; fall back to basic data and guard exceptions
  let city: CityDTO | CityDetailDTO = makeFallbackCity(slug); // Initialize city with fallback
  let rawCity: unknown = null;
  let listings: ListingSummaryDTO[] = []; // Initialize listings

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

  if (rawCity) {
    // Validate using schema-first approach (detail → basic)
    const detailResult = CityDetailDTOSchema.safeParse(rawCity);
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
        // city remains fallbackCity if validation fails
      }
    }
  }

  // Only fetch listings when city validation passes
  if (city) {
    // Ensure city is defined before fetching listings
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
  }

  return (
    <Suspense
      fallback={
        <div
          className="h-screen rounded-lg bg-muted animate-pulse"
          role="status"
          aria-label="Loading city view"
          aria-busy="true"
        />
      }
    >
      <ClientCityDetailViewWrapper city={city} listings={listings} />
    </Suspense>
  );
}
