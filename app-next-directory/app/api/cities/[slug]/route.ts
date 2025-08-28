import { NextRequest, NextResponse } from 'next/server';
import { getCityBySlug } from '@/lib/data/city';

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
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, city });
  } catch (error) {
    console.error('[ERROR] Cities/[slug] API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch city details' },
      { status: 500 }
    );
  }
}
