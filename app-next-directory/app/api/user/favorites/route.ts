import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { client } from '@/lib/sanity/client';
import type { UserRole } from '@/types/auth';
import { ensureSanityUser } from '@/lib/sanity/user';

// Get user's favorites
export async function GET() {
  const session = await auth();

  const user = session?.user as { id?: string; role?: UserRole; email?: string | null; name?: string | null } | undefined;
  const userId: string | undefined = user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureSanityUser({
      id: userId,
      name: user?.name ?? null,
      email: user?.email ?? null,
      role: user?.role ?? null,
    });

    // Fetch user's favorites from Sanity
    const favorites = await client.fetch(
      `*[_type == "userFavorite" && user._ref == $userId] {
        _id,
        listing -> {
          _id,
          name,
          "slug": slug.current,
          mainImage {
            asset -> {
              url
            }
          },
          city -> {
            name
          }
        },
        createdAt
      }`,
      { userId }
    );

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error('Failed to fetch favorites:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Add listing to favorites
export async function POST(request: NextRequest) {
  const session = await auth();

  const user = session?.user as { id?: string; role?: UserRole; email?: string | null; name?: string | null } | undefined;
  const userId: string | undefined = user?.id;
  const userRole: UserRole = user?.role || 'unidentifiedUser';

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug } = body;

    if (!slug || typeof slug !== 'string') {
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

    const favoriteId = `userFavorite-${sanityUser._id}-${listingId}`;
    const favorite = await client.createOrReplace({
      _id: favoriteId,
      _type: 'userFavorite',
      user: { _type: 'reference', _ref: sanityUser._id },
      listing: { _type: 'reference', _ref: listingId },
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ 
      favorited: true, 
      message: 'Added to favorites', 
      favoriteId: favorite._id 
    });
  } catch (error) {
    console.error('Failed to add favorite:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Remove listing from favorites
export async function DELETE(request: NextRequest) {
  const session = await auth();

  const user = session?.user as { id?: string; role?: UserRole; email?: string | null; name?: string | null } | undefined;
  const userId: string | undefined = user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug } = body;

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'Listing slug is required' }, { status: 400 });
    }

    // Resolve listing by slug to get its Sanity ID
    const listing = await client.fetch(`*[_type == "listing" && slug.current == $slug][0]{ _id }`, { slug });
    if (!listing?._id) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    const listingId = listing._id;

    // Find and remove the favorite
    const existingFavorite = await client.fetch(
      `*[_type == "userFavorite" && user._ref == $userId && listing._ref == $listingId][0]`,
      { userId, listingId }
    );

    if (existingFavorite) {
      await client.delete(existingFavorite._id);
      return NextResponse.json({ 
        favorited: false, 
        message: 'Removed from favorites' 
      });
    } else {
      return NextResponse.json({ 
        favorited: false, 
        message: 'Not in favorites' 
      });
    }
  } catch (error) {
    console.error('Failed to remove favorite:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}