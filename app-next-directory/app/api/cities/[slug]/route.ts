import type { NextRequest } from 'next/server';
import { getE2ECityDetail } from '@/data/e2e/discovery-fixtures';
import { getCityBySlug } from '@/lib/data/city';
import { isSanityConfigured } from '@/lib/sanity/env';
import { ApiResponseHandler } from '@/utils/api-response';

// Define the shape of the context parameter for Next.js 15+
type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
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
    return ApiResponseHandler.error('Failed to fetch city details', 500, {
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
