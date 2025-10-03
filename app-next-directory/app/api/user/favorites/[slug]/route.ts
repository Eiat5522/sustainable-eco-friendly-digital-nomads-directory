import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { client } from '@/lib/sanity/client';
import type { UserRole } from '@/types/auth';
import { ensureSanityUser, unfavoriteListing } from '@/lib/sanity/user';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

// Add/Remove a specific listing from favorites
export async function POST(request: NextRequest, { params }: RouteContext) {
  const session = await auth();

  const user = session?.user as { id?: string; role?: UserRole; email?: string | null; name?: string | null } | undefined;
  const userId: string | undefined = user?.id;
  const userRole: UserRole = user?.role || 'unidentifiedUser';
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: 'Listing slug is required' }, { status: 400 });
    }

    const sanityUser = await ensureSanityUser({
      id: userId,
      name: user?.name ?? null,
      email: user?.email ?? null,
      role: userRole,
    });

    if (!sanityUser) {
      return NextResponse.json({ error: 'Unable to access user profile' }, { status: 500 });
    }

    // Resolve listing by slug to get its Sanity ID
    const listing = await client.fetch(`*[_type == "listing" && slug.current == $slug][0]{ _id }`, { slug });
    if (!listing?._id) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    const listingId = listing._id;

    // Check if already favorited
    const existingFavorite = await client.fetch(
      `*[_type == "userFavorite" && user._ref == $userId && listing._ref == $listingId][0]`,
      { userId, listingId }
    );

    if (existingFavorite) {
      // Remove from favorites
      await client.delete(existingFavorite._id);
      return NextResponse.json({ favorited: false, message: 'Removed from favorites' });
    } else {
      // Add to favorites
      const favorite = await client.create({
        _type: 'userFavorite',
        user: { _type: 'reference', _ref: sanityUser._id },
        listing: { _type: 'reference', _ref: listingId },
        createdAt: new Date().toISOString(),
      });
      return NextResponse.json({ favorited: true, message: 'Added to favorites', favoriteId: favorite._id });
    }
  } catch (error) {
    console.error('Failed to toggle favorite:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ error: 'Missing listing slug' }, { status: 400 });
  }

  try {
    await unfavoriteListing(session.user.id, slug);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to unfavorite listing:', error);
    return NextResponse.json({ error: 'Failed to unfavorite listing' }, { status: 500 });
  }
}

// Check if a listing is favorited by the user
export async function GET(request: NextRequest, { params }: RouteContext) {
  const session = await auth();

  const user = session?.user as { id?: string; email?: string | null; name?: string | null; role?: UserRole | null } | undefined;
  const userId: string | undefined = user?.id;

  if (!userId) {
    return NextResponse.json({ favorited: false });
  }

  try {
    const { slug } = await params;

    if (!slug) return NextResponse.json({ favorited: false });

    const listing = await client.fetch(`*[_type == "listing" && slug.current == $slug][0]{ _id }`, { slug });
    const listingId = listing?._id;

    if (!listingId) return NextResponse.json({ favorited: false });

    const favorite = await client.fetch(
      `*[_type == "userFavorite" && user._ref == $userId && listing._ref == $listingId][0]`,
      { userId, listingId }
    );

    return NextResponse.json({ favorited: !!favorite });
  } catch (error) {
    console.error('Failed to check favorite status:', error);
    return NextResponse.json({ favorited: false });
  }
}
