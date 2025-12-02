import { groq } from 'next-sanity';
import { client } from './client';

// GROQ query to fetch a single listing by slug
const LISTING_BY_SLUG_QUERY = groq`
  *[_type == "listing" && slug.current == $slug][0]{
    _id,
    name,
    "slug": slug.current,
    city->{
      _id,
      name,
      "slug": slug.current,
      country
    },
    type,
    category,
    address,
    location{lat, lng, alt},
    primaryImage,
    galleryImages,
    ecoFocusTags[]->{
      _id,
      name
    },
    priceRange,
    contactPhone,
    contactEmail,
    website,
    shortDescription,
    longDescription,
    reviews[]->{
      _id,
      rating,
      comment,
      "userId": user._ref,
      "user": user->{
        name,
        image
      },
      "createdAt": _createdAt
    },
    amenities[]->{
      _id,
      name,
      description,
      badge
    },
    coworkingDetails,
    accommodationDetails,
    cafeDetails,
    restaurantDetails,
    activitiesDetails,
    digitalNomadFeatures[]->{
      _id,
      name,
      slug,
      description,
      icon
    },
    moderation{status, featured, verificationStatus}
  }
`;

/**
 * Fetch a single listing from Sanity by its slug.
 * @param slug - The slug (string) of the listing
 * @param usePreview - Whether to fetch draft content (preview) or published
 * @returns A GROQ query result or null if not found
 */
import type { AppListingDetail } from '@/types/appView';

export async function getListingData(
  slug: string,
  _usePreview = false
): Promise<AppListingDetail | null> {
  try {
    const listing = await client.fetch(LISTING_BY_SLUG_QUERY, { slug });
    // Map the raw listing to the DTO
    if (!listing) return null;
    const { mapSanityListingToAppListingDetail } = await import('@/lib/listings');
    return mapSanityListingToAppListingDetail(listing);
  } catch (error) {
    console.error('Error fetching listing data for slug:', slug, error);
    return null;
  }
}
