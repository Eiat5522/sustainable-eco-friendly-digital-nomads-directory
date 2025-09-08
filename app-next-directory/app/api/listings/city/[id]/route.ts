import type { NextRequest } from 'next/server';
import { ApiResponseHandler } from '@/utils/api-response';
import { getListingsByCityId } from '@/lib/data/city';

type RouteContext = {
  params: { id: string };
};

export async function GET(
  request: NextRequest,
  { params: { id } }: RouteContext
) {
  try {
    // id is available here without await
    const listings = await getListingsByCityId(id);
    return ApiResponseHandler.success({ listings });
  } catch (error) {
    console.error('[ERROR] listings/city/[id] API:', error);
    return ApiResponseHandler.error('Failed to fetch listings', 500);
  }
}

