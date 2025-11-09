// src/lib/listings.ts
// Maps a raw Sanity listing result to AppListingDetail DTO
import { AppListingDetail, AppListingCard } from '@/types/appView';

// Narrow unknown raw to Sanity listing-shaped object (not AppListingCard) with required fields
import type { SanityImage, SanityGalleryImage } from '@/types/appView';

const normalizeTags = (tags: Array<string | { name?: string }> | undefined) =>
  Array.isArray(tags)
    ? tags.map((tag: any) => (typeof tag === 'string' ? tag : tag?.name)).filter(Boolean)
    : [];

export type SanityListingRaw = {
  _id: string;
  name: string;
  slug: { _type: 'slug'; current: string };
  city?: {
    _id: string;
    name: string;
    slug: { _type: 'slug'; current: string };
    country?: string;
  } | null;
  ecoFocusTags?: Array<string | { name?: string }>;
  digitalNomadFeatures?: Array<string | { name?: string }>;
  priceRange?: AppListingCard['priceRange'];
  website?: string | null;
  primaryImage?: SanityImage;
  galleryImages?: SanityGalleryImage[];
  shortDescription?: string;
  address?: string;
  category?: string;
  location?: { lat: number; lng: number };
  type?: string;
  longDescription?: string;
  reviews?: any[];
  amenities?: any[];
  contactPhone?: string;
  contactEmail?: string;
  lastVerifiedDate?: string;
  coworkingDetails?: any;
  accommodationDetails?: any;
  cafeDetails?: any;
  restaurantDetails?: any;
  activitiesDetails?: any;
};

export function isSanityListing(raw: any): raw is SanityListingRaw {
  const hasId = (typeof raw?._id === 'string' && raw._id.trim().length > 0);
  const hasName =
    typeof raw?.name === 'string' && raw.name.trim().length > 0;
  const hasSlug =
    raw?.slug &&
    typeof raw.slug === 'object' &&
    raw.slug._type === 'slug' &&
    typeof raw.slug.current === 'string' &&
    raw.slug.current.trim().length > 0;

  return hasId && hasName && hasSlug;
}

export function mapSanityListingToCard(raw: unknown): AppListingCard {
  if (!isSanityListing(raw)) {
    throw new Error('Invalid Sanity listing object');
  }

  return {
    id: raw._id,
    name: raw.name,
    slug: raw.slug.current, // AppListingCard expects string slug
    city: raw.city
      ? {
          id: raw.city._id,
          name: raw.city.name,
          slug: raw.city.slug.current,
          country: raw.city.country,
        }
      : null,
    ecoFocusTags: normalizeTags(raw.ecoFocusTags),
    digitalNomadFeatures: normalizeTags(raw.digitalNomadFeatures),
    priceRange: raw.priceRange,
    website: raw.website,
    primaryImage: raw.primaryImage,
    galleryImages: raw.galleryImages || [], // Ensure it's an array
    shortDescription: raw.shortDescription,
    address: raw.address,
    category: raw.category,
    location: raw.location
      ? { lat: raw.location.lat, lng: raw.location.lng }
      : undefined,
    type: raw.type
  };
}
export function mapSanityListingToAppListingDetail(raw: SanityListingRaw): AppListingDetail {
  return {
    id: raw._id,
    name: raw.name,
    slug: raw.slug.current, // AppListingDetail expects string slug
    city: raw.city
      ? {
          id: raw.city._id || '',
          name: raw.city.name || '',
          slug: raw.city.slug.current, // AppListingDetail expects string slug
          country: raw.city.country,
        }
      : null,
    type: raw.type,
    category: raw.category,
    address: raw.address,
    location: raw.location
      ? { lat: raw.location.lat, lng: raw.location.lng }
      : undefined,
    primaryImage: raw.primaryImage,
    galleryImages: raw.galleryImages,
    ecoFocusTags: normalizeTags(raw.ecoFocusTags),
    priceRange: raw.priceRange,
    contactPhone: raw.contactPhone,
    contactEmail: raw.contactEmail,
    website: raw.website ?? undefined,
    shortDescription: raw.shortDescription,
    longDescription: raw.longDescription,
    lastVerifiedDate: raw.lastVerifiedDate,
    reviews: Array.isArray(raw.reviews)
      ? raw.reviews
          .filter((review: any) => review && typeof review === 'object')
          .map((review: any) => ({
            id: review?._id ?? '',
            listingId: raw._id,
            userId: review?.user?._id ?? '',
            rating: review?.rating ?? null,
            comment: review?.comment ?? '',
            user:
              review?.user && typeof review.user === 'object'
                ? {
                    name: String(review.user?.name ?? '').trim() || 'Anonymous',
                    image: typeof review.user?.image === 'string'
                      ? (review.user.image.trim() || undefined)
                      : undefined

                  }
                : { name: 'Anonymous' },
            createdAt: review?.createdAt ?? null
          }))
      : [],
    amenities: Array.isArray(raw.amenities)
      ? raw.amenities
          .filter((amenity: any) => amenity && typeof amenity === 'object')
          .map((amenity: any) => ({
            _id: amenity?._id ?? undefined,
            name: amenity?.name ?? undefined,
            description: amenity?.description ?? undefined,
            badge: amenity?.badge ?? undefined
          }))
      : [],
    coworkingDetails: raw.coworkingDetails,
    accommodationDetails: raw.accommodationDetails,
    cafeDetails: raw.cafeDetails,
    restaurantDetails: raw.restaurantDetails,
    activitiesDetails: raw.activitiesDetails,
    digitalNomadFeatures: normalizeTags(raw.digitalNomadFeatures),
  };
}