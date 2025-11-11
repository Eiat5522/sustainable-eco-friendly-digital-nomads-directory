import type { NextRequest } from 'next/server';
import { ApiResponseHandler } from '@/utils/api-response';
import { getListingsByCityId } from '@/lib/data/city';
import { getE2EListingsForCity } from '@/data/e2e/discovery-fixtures';
import { isSanityConfigured } from '@/lib/sanity/env';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;
  if (!isSanityConfigured()) {
    const fallbackListings = getE2EListingsForCity(id);
    if (!fallbackListings.length) {
      return ApiResponseHandler.notFound('Listings');
    }
    return ApiResponseHandler.success({ listings: fallbackListings });
  }

  try {
    const listings = await getListingsByCityId(id);
    if (!Array.isArray(listings) || listings.length === 0) {
      // No listings found for this city
      return ApiResponseHandler.notFound('Listings');
    }

    return ApiResponseHandler.success({ listings });
  } catch (error) {
    return ApiResponseHandler.error('Failed to fetch listings', 500);
  }
}
