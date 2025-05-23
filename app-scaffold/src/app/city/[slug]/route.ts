import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params; // This will be "Koh-Samui" if that's the slug in the URL

  // You can now use the slug to fetch data for the specific city
  // For example, fetch city data from Sanity or your database
  // const cityData = await getCityData(slug);

  // For now, let's just return the slug
  return NextResponse.json({ message: `Data for city: ${slug}` });
}

// You can add other HTTP method handlers here as needed:
// export async function POST(request: NextRequest, { params }: { params: { slug: string } }) { ... }
// export async function PUT(request: NextRequest, { params }: { params: { slug: string } }) { ... }
// export async function DELETE(request: NextRequest, { params }: { params: { slug: string } }) { ... }
