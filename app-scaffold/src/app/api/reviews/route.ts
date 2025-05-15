import { NextResponse } from 'next/server';
import { getClient } from '@/lib/sanity/client';
import { z } from 'zod';

const reviewSchema = z.object({
  listingId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(10).max(1000),
  userId: z.string()
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');

    const query = `*[_type == "review" ${
      listingId ? `&& listing._ref == $listingId` : ''
    }] | order(_createdAt desc) {
      _id,
      rating,
      comment,
      _createdAt,
      "author": author->name,
      "listing": listing->name
    }`;

    const reviews = await getClient().fetch(query, { listingId });

    return NextResponse.json({ success: true, data: reviews });
  } catch (error) {
    console.error('Reviews API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = reviewSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid review data' },
        { status: 400 }
      );
    }

    const { listingId, rating, comment, userId } = validatedData.data;

    const review = await getClient(true).create({
      _type: 'review',
      rating,
      comment,
      listing: { _type: 'reference', _ref: listingId },
      author: { _type: 'reference', _ref: userId }
    });

    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    console.error('Review Creation Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
