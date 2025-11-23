import type { NextRequest } from 'next/server';
import { getE2EListingsForCity } from '@/data/e2e/discovery-fixtures';
import { getListingsByCityId } from '@/lib/data/city';
import { isSanityConfigured } from '@/lib/sanity/env';
import { ApiResponseHandler } from '@/utils/api-response';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
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
    return ApiResponseHandler.error('Failed to fetch listings', 500, {
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
