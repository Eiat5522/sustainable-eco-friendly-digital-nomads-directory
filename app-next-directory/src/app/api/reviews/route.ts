import { client } from '@/lib/sanity/client';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { revalidateTag } from 'next/cache';
import { hasFeaturePermission, UserRole } from '@/types/auth';
import { structuredLogger, getRequestContext } from '@/lib/logger';
import { ensureSanityUser } from '@/lib/sanity/user';

export async function POST(request: Request) {
  const session = await auth();

  const user = session?.user as { id?: string; role?: UserRole; email?: string | null; name?: string | null } | undefined;
  const userId: string | undefined = user?.id;
  const userRole: UserRole = user?.role || 'unidentifiedUser';
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has permission to submit reviews
  if (!hasFeaturePermission(userRole, 'submitReviews')) {
    return NextResponse.json({ error: 'Forbidden: Insufficient permissions to create reviews' }, { status: 403 });
  }

  try {
    const { rating, comment, listingId } = await request.json();

    if (!rating || !comment || !listingId) {
      return NextResponse.json({ error: 'Invalid or missing fields' }, { status: 422 });
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be a number between 1 and 5' }, { status: 422 });
    }

    if (typeof comment !== 'string' || !comment.trim()) {
      return NextResponse.json({ error: 'Comment is required' }, { status: 422 });
    }

    if (typeof listingId !== 'string') {
      return NextResponse.json({ error: 'Invalid listing ID' }, { status: 422 });
    }

    // Validate referenced documents to avoid dangling references
    const [listingDoc, sanityUser] = await Promise.all([
      client.getDocument(listingId),
      ensureSanityUser({
        id: userId,
        name: user?.name ?? null,
        email: user?.email ?? null,
        role: userRole,
      }),
    ]);

    if (!listingDoc || !sanityUser) {
      return NextResponse.json({ error: 'Invalid reference(s)' }, { status: 400 });
    }

    // Check if user has already reviewed this listing
    const existingReview = await client.fetch(
      `*[_type == "review" && listing._ref == $listingId && user._ref == $userId][0]`,
      { listingId, userId }
    );

    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this listing' }, { status: 409 });
    }

    const newReview = await client.create({
      _type: 'review',
      listing: { _type: 'reference', _ref: listingId },
      user: { _type: 'reference', _ref: sanityUser._id },
      rating,
      comment: comment.trim(),
      approved: false, // Reviews need approval by default
      createdAt: new Date().toISOString(),
    });

    // Attempt to revalidate the listing page cache using slug if present
    const listingSlug = (listingDoc as any)?.slug?.current as string | undefined;
    if (listingSlug) {
      try {
        revalidateTag(`listing:${listingSlug}`);
      } catch {
        // ignore if not in a revalidatable context
      }
    }

    return NextResponse.json(newReview);
  } catch (error) {
    structuredLogger.apiError('/api/reviews', error, {
      ...getRequestContext(request),
      userId,
      userRole,
      operation: 'create_review'
    });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}