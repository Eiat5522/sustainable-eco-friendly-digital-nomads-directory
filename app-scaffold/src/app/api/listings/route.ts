import { NextResponse } from 'next/server';
import { getClient } from '@/lib/sanity/client';
import { z } from 'zod';

const querySchema = z.object({
  category: z.string().optional(),
  location: z.string().optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  featured: z.enum(['true', 'false']).optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const validatedParams = querySchema.safeParse(params);

    if (!validatedParams.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    const { category, location, minRating, featured } = validatedParams.data;
    const query = `*[_type == "listing"] ${
      category ? `&& category->name == $category` : ''
    } ${location ? `&& location.city match $location + "*"` : ''} ${
      minRating ? `&& ecoRating >= $minRating` : ''
    } ${featured === 'true' ? `&& isFeatured == true` : ''} | order(_createdAt desc)`;

    const listings = await getClient().fetch(query, validatedParams.data);

    return NextResponse.json({ success: true, data: listings });
  } catch (error) {
    console.error('Listings API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}
