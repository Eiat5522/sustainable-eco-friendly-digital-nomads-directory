import type { SanityListing } from '../../types/sanity';
import { getClient } from './client';

// GROQ query to fetch a single listing by slug
const LISTING_BY_SLUG_QUERY = `
  *[_type == "listing" && slug.current == $slug][0] {
    _id,
    _type,
    _createdAt,
    _updatedAt,
    _rev,
    name,
    "slug": slug.current,
    description_short,
    description_long,
    category,
    city->{
      _id,
      title,
      "slug": slug.current
    },
    primaryImage,
    ecoTags,
    digital_nomad_features,
    last_verified_date,
    reviews,
    addressString,
    website,
    contactInfo,
    openingHours,
    ecoNotesDetailed,
    sourceUrls,
    rating,
    priceRange,
    galleryImages[]{
      ...,
      asset->
    }
  }
`;

/**
 * Fetch a single listing from Sanity by its slug.
 * @param slug - The slug (string) of the listing
 * @param usePreview - Whether to fetch draft content (preview) or published
 * @returns A SanityListing object or null if not found
 */
export async function getListingData(
  slug: string,
  usePreview = false
): Promise<SanityListing | null> {
  const client = getClient(usePreview);
  try {
    const listing = await client.fetch<SanityListing | null>(
      LISTING_BY_SLUG_QUERY,
      { slug }
    );
    return listing;
  } catch (error) {
    console.error("Error fetching listing data for slug:", slug, error);
    return null;
  }
}
