// src/lib/listings.ts
// Maps a raw Sanity listing result to AppListingDetail DTO
import type { AppListingDetail, AppListingCard } from '@/types/appView';

// Narrow unknown raw to Sanity listing-shaped object (not AppListingCard) with required fields
import type { SanityImage, SanityGalleryImage } from '@/types/appView';

type TagValue = string | { name?: string | null };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNonEmptyString = (value: string | null | undefined): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const normalizeTags = (tags?: TagValue[]) => {
  if (!Array.isArray(tags)) return [];

  return tags
    .map(tag => (typeof tag === 'string' ? tag : tag?.name ?? ''))
    .filter(isNonEmptyString)
    .map(tag => tag.trim());
};

type SanityReviewUser = {
  _id?: string;
  name?: string | null;
  image?: string | null;
};

type SanityReviewRaw = {
  _id?: string;
  user?: SanityReviewUser;
  rating?: number | null;
  comment?: string | null;
  createdAt?: string | null;
};

type SanityAmenityRaw = {
  _id?: string;
  name?: string;
  description?: string;
  badge?: {
    asset?: {
      url?: string;
    };
  };
};

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
  reviews?: SanityReviewRaw[];
  amenities?: SanityAmenityRaw[];
  contactPhone?: string;
  contactEmail?: string;
  lastVerifiedDate?: string;
  coworkingDetails?: AppListingDetail['coworkingDetails'];
  accommodationDetails?: AppListingDetail['accommodationDetails'];
  cafeDetails?: AppListingDetail['cafeDetails'];
  restaurantDetails?: AppListingDetail['restaurantDetails'];
  activitiesDetails?: AppListingDetail['activitiesDetails'];
};

const isSanityReviewRaw = (value: unknown): value is SanityReviewRaw => {
  if (!isRecord(value)) return false;
  if ('user' in value && value.user !== undefined && !isRecord(value.user)) return false;
  return true;
};

const isSanityAmenityRaw = (value: unknown): value is SanityAmenityRaw => isRecord(value);

export function isSanityListing(raw: unknown): raw is SanityListingRaw {
  if (!isRecord(raw)) return false;

  const hasId = typeof raw._id === 'string' && raw._id.trim().length > 0;
  const hasName =
    typeof raw.name === 'string' && raw.name.trim().length > 0;
  const hasSlug =
    isRecord(raw.slug) &&
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
          .filter(isSanityReviewRaw)
          .map((review) => ({
        id: review?._id ?? '',
        listingId: raw._id,
        userId: review?.user?._id ?? '',
        rating: typeof review?.rating === 'number' ? review.rating : 0,
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
        createdAt: review?.createdAt ?? new Date().toISOString()
      }))
      : [],
    amenities: Array.isArray(raw.amenities)
      ? raw.amenities
          .filter(isSanityAmenityRaw)
        .map((amenity) => ({
          _id: amenity?._id ?? '',
          name: amenity?.name ?? '',
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
