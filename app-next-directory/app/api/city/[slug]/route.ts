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
  const { slug } = await context.params;
  try {
    const city = await getCityBySlug(slug);
    if (!city) {
      return ApiResponseHandler.notFound('City');

    }
    // Return a consistent response shape
    return ApiResponseHandler.success({ city });
  } catch (err) {
    return ApiResponseHandler.error('Failed to fetch city', 500);
  }
}

// You can add other HTTP method handlers here as needed:
// export async function POST(request: NextRequest, context: RouteContext) { ... }
// export async function PUT(request: NextRequest, context: RouteContext) { ... }
// export async function DELETE(request: NextRequest, context: RouteContext) { ... }
