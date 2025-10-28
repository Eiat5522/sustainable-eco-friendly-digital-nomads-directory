import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GET, POST, DELETE, testControl } from '../../../app/api/user/favorites/route';
import { createTestData } from '@/tests/helpers/test-data';

if (!testControl) {
  throw new Error('testControl is unavailable. Ensure NODE_ENV is "test" when running integration tests.');
}

type FavoriteDoc = {
  _id: string;
  userId: string;
  listingId: string;
  createdAt: string;
};

const data = createTestData();
const sessionUser = data.users.find((user) => user.role === 'user') ?? data.users[0];
const listing = data.listings[0];

const favoritesStore: FavoriteDoc[] = [];

const resetOverrides = () => {
  testControl.authOverride = undefined;
  testControl.ensureSanityUserOverride = undefined;
  testControl.clientFetchOverride = undefined;
  testControl.clientCreateOrReplaceOverride = undefined;
  testControl.clientDeleteOverride = undefined;
  testControl.parseBodyOverride = undefined;
};

const parseJson = async (response: Response) => ({
  status: response.status,
  body: await response.json(),
});

describe('API /api/user/favorites integration', () => {
  beforeEach(() => {
    favoritesStore.length = 0;

    const sanityUserId = sessionUser.id;

    testControl.authOverride = async () => ({
      user: {
        id: sessionUser.id,
        role: 'user',
        email: sessionUser.email,
        name: sessionUser.name,
      },
    });

    testControl.ensureSanityUserOverride = async () => ({
      _id: sanityUserId,
    });

    testControl.clientFetchOverride = jest.fn(async (query: string, params?: Record<string, any>) => {
      if (query.includes('_type == "listing"') && query.includes('slug.current')) {
        if (params?.slug === listing.slug?.current) {
          return { _id: listing._id };
        }
        return null;
      }

      if (query.includes('_type == "userFavorite"') && query.includes('listing ->')) {
        return favoritesStore
          .filter((favorite) => favorite.userId === params?.sanityUserId)
          .map((favorite) => ({
            _id: favorite._id,
            createdAt: favorite.createdAt,
            listing: {
              _id: listing._id,
              name: listing.name,
              slug: listing.slug?.current,
              type: listing.type,
              category: listing.category,
              priceRange: listing.priceRange,
              shortDescription: listing.shortDescription,
              primaryImage: listing.primaryImage ?? null,
              mainImage: listing.mainImage ?? null,
              ecoFocusTags: (listing.ecoFocusTags ?? []).map((tag: any) =>
                typeof tag === 'string' ? { name: tag } : { name: tag?.name }
              ),
              digitalNomadFeatures: (listing.digitalNomadFeatures ?? []).map((feature: any) =>
                typeof feature === 'string' ? { name: feature } : { name: feature?.name }
              ),
              city: listing.city
                ? { name: listing.city.name, country: listing.city.country ?? '' }
                : null,
            },
          }));
      }

      if (query.includes('_type == "userFavorite"') && query.includes('[0]')) {
        const target = favoritesStore.find(
          (favorite) =>
            favorite.userId === params?.userId && favorite.listingId === params?.listingId
        );
        return target ? { _id: target._id } : null;
      }

      return null;
    });

    testControl.clientCreateOrReplaceOverride = jest.fn(async (doc: any) => {
      const entry: FavoriteDoc = {
        _id: doc._id,
        userId: doc.user._ref,
        listingId: doc.listing._ref,
        createdAt: doc.createdAt,
      };

      const existingIndex = favoritesStore.findIndex((favorite) => favorite._id === doc._id);
      if (existingIndex >= 0) {
        favoritesStore[existingIndex] = entry;
      } else {
        favoritesStore.push(entry);
      }

      return { _id: doc._id };
    });

    testControl.clientDeleteOverride = jest.fn(async (id: string) => {
      const index = favoritesStore.findIndex((favorite) => favorite._id === id);
      if (index >= 0) {
        favoritesStore.splice(index, 1);
      }
    });
  });

  afterEach(() => {
    resetOverrides();
  });

  it('adds, lists, and removes favorites while hydrating listing data from Sanity', async () => {
    const postResponse = await POST(
      new Request('http://localhost/api/user/favorites', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug: listing.slug?.current }),
      })
    );
    const post = await parseJson(postResponse);

    expect(post.status).toBe(200);
    expect(post.body).toEqual({
      favorited: true,
      message: 'Added to favorites',
      favoriteId: expect.any(String),
    });
    expect(favoritesStore).toHaveLength(1);
    expect(favoritesStore[0]).toMatchObject({
      userId: sessionUser.id,
      listingId: listing._id,
    });

    const getResponse = await GET();
    const favorites = await parseJson(getResponse);

    expect(favorites.status).toBe(200);
    expect(favorites.body).toEqual({
      favorites: [
        expect.objectContaining({
          _id: favoritesStore[0]._id,
          listing: expect.objectContaining({
            _id: listing._id,
            name: listing.name,
            slug: listing.slug?.current,
            city: expect.objectContaining({ name: listing.city?.name }),
          }),
          createdAt: favoritesStore[0].createdAt,
        }),
      ],
    });

    const deleteResponse = await DELETE(
      new Request('http://localhost/api/user/favorites', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug: listing.slug?.current }),
      })
    );
    const deletion = await parseJson(deleteResponse);

    expect(deletion.status).toBe(200);
    expect(deletion.body).toEqual({
      favorited: false,
      message: 'Removed from favorites',
    });
    expect(favoritesStore).toHaveLength(0);

    const afterRemoval = await parseJson(await GET());
    expect(afterRemoval.status).toBe(200);
    expect(afterRemoval.body).toEqual({ favorites: [] });
  });
});
