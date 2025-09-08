import { NextRequest } from 'next/server';
import { getCityBySlug } from '@/lib/data/city';
import { ApiResponseHandler } from '@/utils/api-response';

// Define the shape of the context parameter for Next.js 15+
type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug } = await context.params;
    const city = await getCityBySlug(slug);
    if (!city) {
      return ApiResponseHandler.notFound('City');
    }
    return ApiResponseHandler.success({ city });
  } catch (error) {
    console.error('[ERROR] Cities/[slug] API:', error);
    return ApiResponseHandler.error('Failed to fetch city details', 500);
  }
}
