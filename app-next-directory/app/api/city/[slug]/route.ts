// No import needed for the Web Request type

import { getCityBySlug } from '@/lib/data/city';
import { ApiResponseHandler } from '@/utils/api-response';
import type { NextRequest } from 'next/server';

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
    console.error('GET /api/city/[slug] failed', { slug, err });
    return ApiResponseHandler.error('Failed to fetch city', 500);
  }
}
