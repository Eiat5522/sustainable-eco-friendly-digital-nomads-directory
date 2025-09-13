import { ApiResponseHandler } from '@/utils/api-response';
import { getClient } from '@/lib/sanity.utils';
import type { FeaturedListingDTO } from '@/types/dto';

// GROQ: pick only needed fields; require moderation.featured == true and published
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
  // Flatten amenity names for simple card display
  "amenityNames": coalesce(amenities[defined(@->name) && @->name != ""]->name, [])
  
}`;

export async function GET() {
  try {
    const client = getClient(false);
    const results = await client.fetch<SanityFeaturedListing[]>(FEATURED_LISTINGS_QUERY);
    const listings: FeaturedListingDTO[] = Array.isArray(results)
      ? results
          .filter((r): r is SanityFeaturedListing => !!r && typeof r._id === 'string' && typeof r.slug === 'string')
          .map((r) => ({
            id: r._id,
            name: r.name ?? '',
            slug: r.slug,
            imageUrl: r.imageUrl || undefined,
            city: r.city || '',
            amenityNames: Array.isArray(r.amenityNames) ? r.amenityNames.filter(Boolean) : [],
          }))
      : [];
    type SanityFeaturedListing = {
    _id: string;
    name?: string;
    slug?: string;
    imageUrl?: string;
    city?: string;
    amenityNames?: (string | null)[];
  }; 

    return ApiResponseHandler.success({ listings });
  } catch (error: any) {
    console.error('GET /api/featured-listings error:', error);
    return ApiResponseHandler.error('Failed to fetch featured listings', 500, error?.message || String(error));
  }
}
