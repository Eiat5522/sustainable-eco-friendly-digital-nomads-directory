// No import needed for the Web Request type

import type { NextRequest } from 'next/server';
import { getCityBySlug } from '@/lib/data/city';
import { structuredLogger } from '@/lib/logger';
import { ApiResponseHandler } from '@/utils/api-response';

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  try {
    const city = await getCityBySlug(slug);
    if (!city) {
      return ApiResponseHandler.notFound('City');
    }
    // Return a consistent response shape
    return ApiResponseHandler.success({ city });
  } catch (err) {
    structuredLogger.error('GET /api/city/[slug] failed', err, { slug, component: 'city-api' });
    return ApiResponseHandler.error('Failed to fetch city', 500);
  }
}
