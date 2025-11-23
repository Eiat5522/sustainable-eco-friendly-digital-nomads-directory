import { logError } from '@/lib/error-handler';
import { fetchJsonWithRetry, getDefaultTimeout, RequestTimeoutError } from '@/lib/http/request';
import type { Listing } from '@/types';
import type { CityDTO } from '@/types/dto';

type CityApiResponse = {
  data?: unknown;
  city?: unknown;
};

type ListingsApiResponse = {
  data?: unknown;
  listings?: unknown;
  success?: boolean;
};

// City details
export async function fetchCityDetails(slug: string): Promise<CityDTO> {
  try {
    const data = await fetchJsonWithRetry<CityApiResponse>(
      `/api/cities/${encodeURIComponent(slug)}`,
      { next: { revalidate: 300 } },
      {
        timeoutMs: getDefaultTimeout(),
        retries: 2,
      }
    );
    const primaryData =
      typeof data?.data === 'object' && data.data !== null
        ? (data.data as Record<string, unknown>)
        : undefined;
    const cityCandidate = primaryData?.city ?? data?.city;

    if (!cityCandidate || typeof cityCandidate !== 'object' || Array.isArray(cityCandidate)) {
      throw new Error('City not found in API response');
    }

    return cityCandidate as CityDTO;
  } catch (error) {
    logError(error, { scope: 'lib:api', action: 'fetchCityDetails', details: { slug } });
    if (error instanceof RequestTimeoutError) {
      throw new Error('Request timed out while fetching city details');
    }
    throw error;
  }
}

// City listings
export async function fetchCityListings(slug: string): Promise<Listing[]> {
  try {
    const data = await fetchJsonWithRetry<ListingsApiResponse>(
      `/api/listings?citySlug=${encodeURIComponent(slug)}`,
      { next: { revalidate: 300 } },
      {
        timeoutMs: getDefaultTimeout(),
        retries: 2,
      }
    );
    const nestedListings =
      typeof data?.data === 'object' && data.data !== null
        ? (data.data as Record<string, unknown>).listings
        : undefined;
    const listingsSource = Array.isArray(nestedListings)
      ? nestedListings
      : Array.isArray(data?.listings)
        ? data.listings
        : [];

    return Array.isArray(listingsSource) ? (listingsSource as Listing[]) : [];
  } catch (error) {
    logError(error, { scope: 'lib:api', action: 'fetchCityListings', details: { slug } });
    return [];
  }
}

// More API functions can be added here
