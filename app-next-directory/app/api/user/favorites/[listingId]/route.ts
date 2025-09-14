import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { client } from '@/lib/sanity/client';
import { hasFeaturePermission, UserRole } from '@/types/auth';

interface RouteParams {
  params: { listingId: string };
}

// Add/Remove a specific listing from favorites
export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth();

  const user = session?.user as { id?: string; role?: UserRole } | undefined;
  const userId: string | undefined = user?.id;
  const userRole: UserRole = user?.role || 'unidentifiedUser';
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Note: There's no specific "favorites" permission in the matrix, but logged-in users should be able to favorite
  // This is a basic user feature that doesn't need special permissions beyond being authenticated

  try {
    const { listingId } = params;

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }

    // Check if listing exists
    const listing = await client.getDocument(listingId);
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

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
        user: { _type: 'reference', _ref: userId },
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

// Check if a listing is favorited by the user
export async function GET(request: Request, { params }: RouteParams) {
  const session = await auth();

  const user = session?.user as { id?: string } | undefined;
  const userId: string | undefined = user?.id;
  
  if (!userId) {
    return NextResponse.json({ favorited: false });
  }

  try {
    const { listingId } = params;

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