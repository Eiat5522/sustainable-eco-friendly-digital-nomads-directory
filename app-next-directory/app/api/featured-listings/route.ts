import { getFeaturedListings } from '@/lib/data-access/home.dal';
import { structuredLogger } from '@/lib/logger';
import { ApiResponseHandler } from '@/utils/api-response';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Number.parseInt(limitParam, 10) : 10;
  const MAX_LIMIT = 100;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, MAX_LIMIT) : 10;

  try {
    const listings = await getFeaturedListings(safeLimit);
    return ApiResponseHandler.success({ listings });
  } catch (error) {
    structuredLogger.error('Failed to fetch featured listings', error, {
      component: 'api/featured-listings',
      limit: safeLimit,
    });
    return ApiResponseHandler.error('Failed to fetch featured listings');
  }
}
