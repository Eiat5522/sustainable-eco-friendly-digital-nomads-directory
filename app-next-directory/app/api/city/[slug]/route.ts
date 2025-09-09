// No import needed for the Web Request type

import { getCityBySlug } from '@/lib/data/city';
import { ApiResponseHandler } from '@/utils/api-response';

type RouteContext = { params: { slug: string } };

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  const { slug } = params;
  try {
    const city = await getCityBySlug(slug);
    if (!city) {
      return ApiResponseHandler.notFound('City');

    }
    // Return a consistent response shape
    return ApiResponseHandler.success({ city });
   console.error('GET /api/city/[slug] failed', { slug, err });atch (err) {
} catch (err) {
  console.error('GET /api/city/[slug] failed', { slug, err });
  return ApiResponseHandler.error('Failed to fetch city', 500);
}
// You can add other HTTP method handlers here as needed:
// export async function POST(request: NextRequest, context: RouteContext) { ... }
// export async function PUT(request: NextRequest, context: RouteContext) { ... }
// export async function DELETE(request: NextRequest, context: RouteContext) { ... }
