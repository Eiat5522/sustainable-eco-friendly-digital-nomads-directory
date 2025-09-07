import { NextRequest } from 'next/dist/server/web/spec-extension/request';
import { NextResponse } from 'next/dist/server/web/spec-extension/response';
import { getCityBySlug } from '@/lib/data/city';

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
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }
    // Return a consistent response shape to match /api/cities/[slug]
    return NextResponse.json({ success: true, city });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch city' }, { status: 500 });
  }
}

// You can add other HTTP method handlers here as needed:
// export async function POST(request: NextRequest, context: RouteContext) { ... }
// export async function PUT(request: NextRequest, context: RouteContext) { ... }
// export async function DELETE(request: NextRequest, context: RouteContext) { ... }
