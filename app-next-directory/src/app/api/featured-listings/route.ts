import { ApiResponseHandler } from '@/utils/api-response';
import { getClient } from '@/lib/sanity.utils';
import type { FeaturedListingDTO } from '@/types/dto';
import { structuredLogger, getRequestContext } from '@/lib/logger';

const FEATURED_LISTINGS_QUERY = `
[_type == "listing"
  && moderation.status == "published"
  && moderation.featured == true
  && defined(slug.current)
  && !(_id in path("drafts.**"))
]
  | order(_updatedAt desc)[0...12]{
  _id,
  name,
  "slug": slug.current,
  "imageUrl": coalesce(primaryImage.asset->url, ""),
  "city": coalesce(city->name, ""),
  "amenityNames": coalesce(amenities[defined(@->name) && @->name != ""]->name, [])
}`;

type SanityFeaturedListing = {
  _id: string;
  name?: string | null;
  slug?: string | null;
  imageUrl?: string | null;
  city?: string | null;
  amenityNames?: (string | null)[];
};

export async function GET(request: Request) {
  try {
    const client = getClient(false);
    const results = await client.fetch<SanityFeaturedListing[]>(FEATURED_LISTINGS_QUERY);

    const listings: FeaturedListingDTO[] = [];
    for (const item of results ?? []) {
      if (!item || typeof item._id !== 'string' || typeof item.slug !== 'string') {
        continue;
      }

      const amenityNames = Array.isArray(item.amenityNames)
        ? item.amenityNames.filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
        : [];

      listings.push({
        id: item._id,
        name: item.name ?? '',
        slug: item.slug,
        imageUrl: item.imageUrl || undefined,
        city: item.city ?? '',
        amenityNames,
      });
    }

    return ApiResponseHandler.success({ listings });
  } catch (error: unknown) {
    structuredLogger.apiError('/api/featured-listings', error, {
      ...getRequestContext(request),
      operation: 'get_featured_listings',
    });
    const message =
      error instanceof Error && typeof error.message === 'string'
        ? error.message
        : String(error);
    return ApiResponseHandler.error('Failed to fetch featured listings', 500, message);
  }
}
