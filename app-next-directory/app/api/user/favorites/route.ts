import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { client } from '@/lib/sanity/client';
import type { UserRole } from '@/types/auth';
import { ensureSanityUser } from '@/lib/sanity/user';
import { getRequestContext, structuredLogger } from '@/lib/logger';

type AuthFn = () => Promise<unknown>;
type EnsureUserFn = (args: {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole | null;
}) => Promise<{ _id?: string } | null>;
type FetchFn = (query: string, params?: Record<string, unknown>) => Promise<unknown>;
type CreateOrReplaceDocument = Parameters<typeof client.createOrReplace>[0];
type CreateOrReplaceFn = (doc: CreateOrReplaceDocument) => ReturnType<typeof client.createOrReplace>;
type DeleteFn = (id: string) => Promise<unknown>;
type ParseBodyFn = (request: NextRequest) => Promise<unknown>;

const isTestEnv = process.env.NODE_ENV === 'test';

type FavoritesTestControl = {
  authOverride?: AuthFn;
  ensureSanityUserOverride?: EnsureUserFn;
  clientFetchOverride?: FetchFn;
  clientCreateOrReplaceOverride?: CreateOrReplaceFn;
  clientDeleteOverride?: DeleteFn;
  parseBodyOverride?: ParseBodyFn;
};

const _testControl: FavoritesTestControl | undefined = isTestEnv
  ? {
      authOverride: undefined,
      ensureSanityUserOverride: undefined,
      clientFetchOverride: undefined,
      clientCreateOrReplaceOverride: undefined,
      clientDeleteOverride: undefined,
      parseBodyOverride: undefined,
    }
  : undefined;

if (process.env.NODE_ENV === 'test') {
  (module.exports as Record<string, unknown>)._testControl = _testControl;
}

// Get user's favorites
export async function GET() {
  const authFn = _testControl?.authOverride ?? auth;
  const ensureUser = _testControl?.ensureSanityUserOverride ?? ensureSanityUser;
  const fetchFn =
    _testControl?.clientFetchOverride ??
    ((query: string, params?: Record<string, unknown>) => client.fetch(query, params));

  const session = await authFn();

  // session may be untyped in tests; cast to unknown before accessing .user
  const user = (session as { user?: { id?: string; role?: UserRole; email?: string | null; name?: string | null } })?.user;
  const userId: string | undefined = user?.id;
  const userRole: UserRole | undefined = user?.role;

  if (!userId || userRole !== 'user') {
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
    structuredLogger.error('Failed to fetch favorites', error, {
      component: 'api/user/favorites',
    });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Add listing to favorites
export async function POST(request: NextRequest) {
  const authFn = _testControl?.authOverride ?? auth;
  const ensureUser = _testControl?.ensureSanityUserOverride ?? ensureSanityUser;
  const fetchFn =
    _testControl?.clientFetchOverride ??
    ((query: string, params?: Record<string, unknown>) => client.fetch(query, params));
  const createOrReplaceFn =
    _testControl?.clientCreateOrReplaceOverride ??
    ((doc: CreateOrReplaceDocument) => client.createOrReplace(doc));

  const session = await authFn();

  const user = (session as { user?: { id?: string; role?: UserRole; email?: string | null; name?: string | null } })?.user;
  const userId: string | undefined = user?.id;
  const userRole: UserRole = user?.role || 'unidentifiedUser';

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const parseBody = _testControl?.parseBodyOverride ?? ((req: NextRequest) => req.json());
    const body = await parseBody(request);
    const { slug } = body as { slug?: string };

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
    const listing = await fetchFn(`*[_type == "listing" && slug.current == $slug][0]{ _id }`, { slug }) as { _id: string } | null;
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
    });

    return NextResponse.json({
      favorited: true,
      message: 'Added to favorites',
      favoriteId: (favorite as { _id: string })._id
    });
  } catch (error) {
    structuredLogger.error('Failed to add favorite', error, {
      ...getRequestContext(request),
      component: 'api/user/favorites',
    });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Remove listing from favorites
export async function DELETE(request: NextRequest) {
  const authFn = _testControl?.authOverride ?? auth;
  const fetchFn =
    _testControl?.clientFetchOverride ??
    ((query: string, params?: Record<string, unknown>) => client.fetch(query, params));
  const deleteFn = _testControl?.clientDeleteOverride ?? ((id: string) => client.delete(id));

  const session = await authFn();

  const user = (session as { user?: { id?: string; role?: UserRole; email?: string | null; name?: string | null } })?.user;
  const userId: string | undefined = user?.id;
  const userRole: UserRole | undefined = user?.role;

  if (!userId || userRole !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const parseBody = _testControl?.parseBodyOverride ?? ((req: NextRequest) => req.json());
    const body = await parseBody(request);
    const { slug } = body as { slug?: string };

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'Listing slug is required' }, { status: 400 });
    }

    // Resolve listing by slug to get its Sanity ID
    const listing = await fetchFn(`*[_type == "listing" && slug.current == $slug][0]{ _id }`, { slug }) as { _id: string } | null;
    if (!listing?._id) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    const listingId = listing._id;

    // Find and remove the favorite
    const existingFavorite = await fetchFn(
      `*[_type == "userFavorite" && user._ref == $userId && listing._ref == $listingId][0]`,
      { userId, listingId }
    ) as { _id: string } | null;

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
    structuredLogger.error('Failed to remove favorite', error, {
      ...getRequestContext(request),
      component: 'api/user/favorites',
    });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
