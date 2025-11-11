// No import needed for the Web Request type

import { getCityBySlug } from '@/lib/data/city';
import { ApiResponseHandler } from '@/utils/api-response';
import type { NextRequest } from 'next/server';
import logger from '@/lib/logger';

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { slug } = await context.params;
  try {
    const city = await getCityBySlug(slug);
    if (!city) {
      return ApiResponseHandler.notFound('City');
    }
    // Return a consistent response shape
    return ApiResponseHandler.success({ city });
  } catch (err) {
    logger.error('GET /api/city/[slug] failed', err, { slug, component: 'city-api' });
    return ApiResponseHandler.error('Failed to fetch city', 500);
  }
}
