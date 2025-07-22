import type { SanityListing, LISTING_BY_SLUG_QUERYResult } from '../../types/sanity-generated';
import { client } from './client';
import { groq } from 'next-sanity';

// GROQ query to fetch a single listing by slug
const LISTING_BY_SLUG_QUERY = groq`
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
    location { lat, lng },
    primaryImage,
    ecoTags,
    digital_nomad_features,
    last_verified_date,
    reviews,
    addressString,
    website,
    contactInfo,
    openingHours,
    shortDescription,
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
 * @returns A GROQ query result or null if not found
 */
export async function getListingData(
  slug: string,
  usePreview = false
): Promise<LISTING_BY_SLUG_QUERYResult> {
  // Use imported client directly (no redeclaration)
  // const client = client(usePreview);

  try {
    const listing = await client.fetch(
      LISTING_BY_SLUG_QUERY,
      { slug }
    );
    return listing;
  } catch (error) {
    console.error("Error fetching listing data for slug:", slug, error);
    return null;
  }
}
