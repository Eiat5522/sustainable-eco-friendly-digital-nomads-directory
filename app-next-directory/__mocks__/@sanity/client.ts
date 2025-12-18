import { jest } from '@jest/globals';
import {
  createTestData,
  getFavoritesForUser,
  listCities,
} from '@/tests/helpers/test-data';

const data = createTestData();

// Check if we should use MSW mode (real HTTP requests to be intercepted by MSW)
const useMSWMode = process.env.SANITY_FETCH_MODE === 'msw';

const mapListingToSanity = (slug: string | undefined) => {
  if (!slug) return null;
  const listing = data.listings.find((l: { slug?: { current: string } }) => l.slug?.current === slug);
  if (!listing) return null;
  const city = listCities().find(entry => entry.slug === listing.city.slug?.current);
  return {
    _id: listing._id,
    name: listing.name,
    slug: listing.slug?.current,
    city: city
      ? { _id: city.id, name: city.name, slug: city.slug, country: city.country }
      : {
          _id: listing.city.slug?.current,
          name: listing.city.name,
          slug: listing.city.slug?.current,
        },
    ecoTags: listing.ecoFocusTags.map((tag: { name: string }) => tag.name),
    nomadFeatures: listing.digitalNomadFeatures,
    website: listing.website,
    priceRange: listing.priceRange,
    shortDescription: listing.shortDescription,
    longDescription: listing.longDescription,
    primaryImage: listing.primaryImage,
    galleryImages: listing.galleryImages,
    amenities: [],
  };
};

const fetch = jest.fn(async (query: string, params: Record<string, unknown> = {}) => {
  if (/_type\s*==\s*"userFavorite"/.test(query)) {
    const userId = params.userId ?? data.users[0]?.id;
    const favorites = getFavoritesForUser(userId);
    return favorites.map((favorite: {
      id: string;
      createdAt: string;
      listingId: string;
    }) => {
      const listing = data.listings.find((item: { _id: string }) => item._id === favorite.listingId);
      return {
        _id: favorite.id,
        createdAt: favorite.createdAt,
        listing: listing
          ? {
              _id: listing._id,
              name: listing.name,
              slug: listing.slug?.current,
              mainImage: {
                asset: { url: `https://images.test/listings/${listing.slug?.current}.jpg` },
              },
              city: { name: listing.city.name },
            }
          : null,
      };
    });
  }

  if (/_type=="listing"/.test(query) && /slug\.current\s*==\s*\$slug/.test(query)) {
    const slug = params.slug ?? params.listingSlug ?? null;
    return slug ? mapListingToSanity(slug) : null;
  }

  if (/_type\s*==\s*"city"/.test(query)) {
    return listCities().map(city => ({
      _id: city.id,
      title: city.name,
      slug: city.slug,
      country: city.country,
      description: city.description,
      sustainabilityScore: city.sustainabilityScore,
      highlights: city.highlights,
      primaryImage: {
        asset: {
          _ref: `image-city-${city.slug}`,
          _id: `image-city-${city.slug}`,
          url: city.heroImage,
          metadata: {
            dimensions: { width: 1200, height: 800 },
          },
        },
      },
    }));
  }

  if (/_type\s*==\s*"ecoTag"/.test(query)) {
    return data.ecoTags.map((tag: { _id: string; name: string; slug: { current: string }; description?: string }) => ({
      _id: tag._id,
      name: tag.name,
      slug: tag.slug.current,
      description: tag.description,
    }));
  }

  if (/moderation\.featured/.test(query)) {
    return data.listings.map((listing: {
      _id: string;
      name: string;
      slug?: { current: string };
      primaryImage?: unknown;
      galleryImages?: unknown[];
      location?: unknown;
      city: { slug?: { current: string }; name: string };
      priceRange?: string;
    }) => ({
      _id: listing._id,
      name: listing.name,
      slug: listing.slug?.current,
      primaryImage: listing.primaryImage,
      galleryImages: listing.galleryImages,
      location: listing.location,
      city: {
        _id: listing.city.slug?.current,
        name: listing.city.name,
        country: listCities().find(city => city.slug === listing.city.slug?.current)?.country,
      },
      priceRange: listing.priceRange,
    }));
  }

  return [];
});

// Real fetch function that makes HTTP requests (for MSW interception)
const realFetch = async (query: string, params: Record<string, unknown> = {}) => {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'test-project';
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'test-dataset';
  const apiVersion = '2024-01-01';

  const url = new URL(`https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`);
  url.searchParams.set('query', query);

  // Add params to the query string
  if (Object.keys(params).length > 0) {
    url.searchParams.set('params', JSON.stringify(params));
  }

  // Use global.fetch which MSW intercepts
  const response = await global.fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Sanity API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.result;
};

export const createClient = jest.fn(() => ({
  fetch: useMSWMode ? realFetch : fetch,
  create: jest.fn().mockResolvedValue({ _id: 'mock-id' }),
  update: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue(''),
  getDocument: jest.fn().mockResolvedValue({ _id: 'mock-id' }),
}));

export default createClient();
