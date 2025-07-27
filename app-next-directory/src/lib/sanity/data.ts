import { client } from './client';
import { groq } from 'next-sanity';
import type { LISTING_BY_SLUG_QUERYResult } from '../../../../sanity/sanity.types';

// GROQ query to fetch a single listing by slug
const LISTING_BY_SLUG_QUERY = groq`
  *[_type == "listing" && slug.current == $slug][0]{
    _id,
    name,
    "slug": slug.current,
    "city": city->{ "_id": _id, name, "slug": slug.current, country },
    "ecoTags": ecoFocusTags[]->name,
    "nomadFeatures": digitalNomadFeatures[]->name,
    contactPhone, contactEmail, website,
    priceRange,
    shortDescription,
    longDescription,
    address,
    location { lat, lng },
    primaryImage{
      ...,
      asset->
    },
    galleryImages[]{
      ...,
      asset->
    },
    lastVerifiedDate,
    reviews[]->{
      _id,
      _type,
      _createdAt,
      _updatedAt,
      _rev,
      author,
      rating,
      comment,
      date
    },
    coworkingDetails: coworking_details{
      capacity,
      pricingPlans[]{ type, price, period },
      openingHours[]{ day, opens, closes }
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
): Promise<LISTING_BY_SLUG_QUERYResult | null> {
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
