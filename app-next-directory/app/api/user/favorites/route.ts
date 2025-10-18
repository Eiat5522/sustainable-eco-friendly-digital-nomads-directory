import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { client } from '@/lib/sanity/client';
import type { UserRole } from '@/types/auth';
import { ensureSanityUser } from '@/lib/sanity/user';

type AuthFn = () => Promise<unknown>;
type EnsureUserFn = (args: {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole | null;
}) => Promise<{ _id?: string } | null>;
type FetchFn = (query: string, params?: Record<string, unknown>) => Promise<any>;
// createOrReplace typically expects an object with at least an _id for Sanity; allow that shape in tests
type CreateOrReplaceFn = (doc: { _id: string } & Record<string, unknown>) => Promise<any>;
type DeleteFn = (id: string) => Promise<unknown>;
type ParseBodyFn = (request: NextRequest) => Promise<any>;
const IS_TEST = process.env.NODE_ENV === 'test';

export const testControl = {
  authOverride: undefined as AuthFn | undefined,
  ensureSanityUserOverride: undefined as EnsureUserFn | undefined,
  clientFetchOverride: undefined as FetchFn | undefined,
  clientCreateOrReplaceOverride: undefined as CreateOrReplaceFn | undefined,
  clientDeleteOverride: undefined as DeleteFn | undefined,
  parseBodyOverride: undefined as ParseBodyFn | undefined,
} as const;

function getAuthFn(): AuthFn {
  if (!IS_TEST) return auth;
  return testControl.authOverride ?? auth;
}
// Similar functions for other dependencies...

// Get user's favorites
export async function GET() {
  const authFn = testControl.authOverride ?? auth;
  const ensureUser = testControl.ensureSanityUserOverride ?? ensureSanityUser;
  const fetchFn =
    testControl.clientFetchOverride ?? ((query: string, params?: Record<string, unknown>) => client.fetch(query, params as any));

  const session = await authFn();

  // session may be untyped in tests; cast to any before accessing .user
  const user = (session as any)?.user as { id?: string; role?: UserRole; email?: string | null; name?: string | null } | undefined;
  const userId: string | undefined = user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sanityUser = await ensureUser({
      id: userId,
      name: user?.name ?? null,
      email: user?.email ?? null,
      role: user?.role ?? null,
    });

    if (!sanityUser) {
      return NextResponse.json({ error: 'Unable to access user profile' }, { status: 500 });
    }

    // Fetch user's favorites from Sanity using the Sanity user ID
    const favorites = await fetchFn(
      `*[_type == "userFavorite" && user._ref == $sanityUserId] {
        _id,
        listing -> {
          _id,
          name,
          "slug": slug.current,
          type,
          category,
          priceRange,
          shortDescription,
          primaryImage {
            alt,
            asset -> {
              url,
              metadata {
                dimensions {
                  width,
                  height
                }
              }
            }
          },
          mainImage {
            asset -> {
              url,
              metadata {
                dimensions {
                  width,
                  height
                }
              }
            }
          },
          ecoFocusTags[] -> {
            name
          },
          digitalNomadFeatures[] -> {
            name
          },
          city -> {
            name,
            country
          }
        },
        createdAt
      }`,
      { sanityUserId: sanityUser._id }
    );

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error('Failed to fetch favorites:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Add listing to favorites
export async function POST(request: NextRequest) {
  const authFn = testControl.authOverride ?? auth;
  const ensureUser = testControl.ensureSanityUserOverride ?? ensureSanityUser;
  const fetchFn =
    testControl.clientFetchOverride ?? ((query: string, params?: Record<string, unknown>) => client.fetch(query, params as any));
  const createOrReplaceFn =
    testControl.clientCreateOrReplaceOverride ?? ((doc: Record<string, unknown>) => client.createOrReplace(doc as any));

  const session = await authFn();

  const user = (session as any)?.user as { id?: string; role?: UserRole; email?: string | null; name?: string | null } | undefined;
  const userId: string | undefined = user?.id;
  const userRole: UserRole = user?.role || 'unidentifiedUser';

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const parseBody = testControl.parseBodyOverride ?? ((req: NextRequest) => req.json());
    const body = await parseBody(request);
    const { slug } = body;

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'Listing slug is required' }, { status: 400 });
    }

    const sanityUser = await ensureUser({
      id: userId,
      name: user?.name ?? null,
      email: user?.email ?? null,
      role: userRole,
    });

    if (!sanityUser) {
      return NextResponse.json({ error: 'Unable to access user profile' }, { status: 500 });
    }

    // Resolve listing by slug to get its Sanity ID
    const listing = await fetchFn(`*[_type == "listing" && slug.current == $slug][0]{ _id }`, { slug });
    if (!listing?._id) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    const listingId = listing._id;

    const favoriteId = `userFavorite-${sanityUser._id}-${listingId}`;
    const favorite = await createOrReplaceFn({
      _id: favoriteId,
      _type: 'userFavorite',
      user: { _type: 'reference', _ref: sanityUser._id },
      listing: { _type: 'reference', _ref: listingId },
      createdAt: new Date().toISOString(),
    } as any);

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
  const authFn = testControl.authOverride ?? auth;
  const fetchFn =
    testControl.clientFetchOverride ?? ((query: string, params?: Record<string, unknown>) => client.fetch(query, params));
  const deleteFn = testControl.clientDeleteOverride ?? ((id: string) => client.delete(id));

  const session = await authFn();

  const user = (session as any)?.user as { id?: string; role?: UserRole; email?: string | null; name?: string | null } | undefined;
  const userId: string | undefined = user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const parseBody = testControl.parseBodyOverride ?? ((req: NextRequest) => req.json());
    const body = await parseBody(request);
    const { slug } = body;

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'Listing slug is required' }, { status: 400 });
    }

    // Resolve listing by slug to get its Sanity ID
    const listing = await fetchFn(`*[_type == "listing" && slug.current == $slug][0]{ _id }`, { slug });
    if (!listing?._id) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    const listingId = listing._id;

    // Find and remove the favorite
    const existingFavorite = await fetchFn(
      `*[_type == "userFavorite" && user._ref == $userId && listing._ref == $listingId][0]`,
      { userId, listingId }
    );

    if (existingFavorite) {
      await deleteFn(existingFavorite._id);
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
