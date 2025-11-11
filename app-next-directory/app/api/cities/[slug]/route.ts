import type { NextRequest } from 'next/server';
import { getCityBySlug } from '@/lib/data/city';
import { ApiResponseHandler } from '@/utils/api-response';
import { getE2ECityDetail } from '@/data/e2e/discovery-fixtures';
import { isSanityConfigured } from '@/lib/sanity/env';

// Define the shape of the context parameter for Next.js 15+
type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { slug } = await context.params;
  if (!isSanityConfigured()) {
    const fallbackCity = getE2ECityDetail(slug);
    if (!fallbackCity) {
      return ApiResponseHandler.notFound('City');
    }
    return ApiResponseHandler.success(fallbackCity);
  }

  try {
    const city = await getCityBySlug(slug);
    if (!city) {
      return ApiResponseHandler.notFound('City');
    }
    return ApiResponseHandler.success(city);
  } catch (error) {
    console.error('[ERROR] Cities/[slug] API:', error);
    return ApiResponseHandler.error('Failed to fetch city details', 500);
  }
}
