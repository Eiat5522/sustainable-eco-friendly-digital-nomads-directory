import { NextRequest } from 'next/dist/server/web/spec-extension/request';
import { NextResponse } from 'next/dist/server/web/spec-extension/response';

// Define the shape of the context parameter for Next.js 15+
type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { slug } = await context.params;

  // You can now use the slug to fetch data for the specific city
  // For example, fetch city data from Sanity or your database
  // const cityData = await getCityData(slug);

  // For now, let's just return the slug
  return NextResponse.json({ message: `Data for city: ${slug}` });
}

// You can add other HTTP method handlers here as needed:
// export async function POST(request: NextRequest, context: RouteContext) { ... }
// export async function PUT(request: NextRequest, context: RouteContext) { ... }
// export async function DELETE(request: NextRequest, context: RouteContext) { ... }
