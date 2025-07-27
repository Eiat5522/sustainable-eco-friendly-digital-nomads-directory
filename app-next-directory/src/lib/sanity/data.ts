import { client } from './client';
import { groq } from 'next-sanity';


// GROQ query to fetch a single listing by slug
const LISTING_BY_SLUG_QUERY = groq`
  *[_type == "listing" && slug.current == $slug][0]{
    _id,
    name,
    "slug": slug.current,
    priceRange,
    coworkingDetails: coworking_details{
      capacity,
      pricingPlans[]{ type, price, period },
      openingHours[]{ day, opens, closes }
    },
    accommodationDetails: accommodation_details{},
    cafeDetails: cafe_details{
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
): Promise<any | null> {
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
