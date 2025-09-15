// src/lib/listings.ts
import listings from '../data/listings.json';
import { Listing } from '../types/listings';
import { toSlug } from './utils/slug';
// Function to map raw JSON to Listing objects
/**
 * TEMP legacy JSON -> Listing mapper (to be deprecated once all data served via Sanity DTO layer)
 */
const ALLOWED_CATEGORIES = ['coworking', 'cafe', 'accommodation', 'activities', 'restaurant'] as const;
type CanonicalCategory = typeof ALLOWED_CATEGORIES[number];
const normalizeCategory = (input: string | undefined): CanonicalCategory => {
  const lc = String(input ?? '').trim().toLowerCase();
  // Common synonyms/plurals/hyphenation
  switch (lc) {
    case 'activity':
    case 'activities':
      return 'activities';
    case 'restaurant':
    case 'restaurants':
      return 'restaurant';
    case 'cafe':
    case 'cafes':
      return 'cafe';
    case 'accommodation':
    case 'accommodations':
      return 'accommodation';
    case 'coworking':
    case 'co-working':
    case 'co working':
      return 'coworking';
    default:
      // Default to a safe, common type if unknown
      return 'coworking';
  }
};

function mapRawToListing(rawListing: any): Listing {

// drop empty _id – let the backend supply a stable id
  const ecoTagsRaw = rawListing.ecoFocusTags || rawListing.ecoTags || [];
  const ecoFocusTags = Array.isArray(ecoTagsRaw)
    ? ecoTagsRaw.map((t: any) => {
        const name = typeof t === 'string' ? t : t?.name;
        return name
          ? { _id: toSlug(name), name, slug: { current: toSlug(name) } }
          : null;
      }).filter(Boolean)
    : [];

  return {
    _id: rawListing.id || rawListing._id || '',
    name: rawListing.name || '',
    slug: typeof rawListing.slug === 'string'
      ? { _type: 'slug', current: rawListing.slug }
      : (rawListing.slug && typeof rawListing.slug === 'object'
          ? { _type: 'slug', current: rawListing.slug.current ?? '' }
          : { _type: 'slug', current: '' }),
    city: typeof rawListing.city === 'string'
      ? { _id: '', name: rawListing.city, slug: { _type: 'slug', current: toSlug(rawListing.city) } }
      : (rawListing.city && typeof rawListing.city === 'object'
          ? { _id: rawListing.city._id ?? '', name: rawListing.city.name ?? '', slug: { _type: 'slug', current: rawListing.city.slug?.current ?? '' } }
          : { _id: '', name: '', slug: { _type: 'slug', current: '' } }),
    type: normalizeCategory(rawListing.category || rawListing.type || 'coworking'),
    address: rawListing.address || '',
    shortDescription: rawListing.shortDescription || '',
    longDescription: rawListing.longDescription || '',
    primaryImage: rawListing.primaryImage || rawListing.primary_image_url ? {
      _type: 'image', // Add _type
      asset: {
        _ref: 'placeholder-ref', // Placeholder ref, as we don't have actual Sanity asset refs here
        _type: 'reference', // Add _type
        url: typeof rawListing.primaryImage === 'string'
          ? rawListing.primaryImage
          : rawListing.primaryImage?.asset?.url || rawListing.primary_image_url
      }
    } : undefined,
    galleryImages: Array.isArray(rawListing.galleryImages)
      ? rawListing.galleryImages.map((img: any) => {
          if (typeof img === 'string') {
            return { _type: 'image', asset: { url: img } };
          }
          // If this is already a Sanity image, keep it untouched
          if (img && typeof img === 'object' && (img._type === 'image' || img.asset?._ref)) {
            return img;
          }
          // Coerce plain object with a url on asset (or top-level) to a normalized shape
          const url = img?.asset?.url ?? img?.url;
          return url ? { _type: 'image', asset: { url } } : img;
        })
      : (rawListing.gallery_image_urls?.map((url: string) => ({
          _type: 'image',
          asset: { url },
        })) || []),
    ecoFocusTags,
    digitalNomadFeatures: (rawListing.digitalNomadFeatures || []).map((feature: any) => {
      const name = typeof feature === 'string' ? feature : feature?.name;
      return name ? name : null;
    }).filter(Boolean) as string[],
    lastVerifiedDate: rawListing.lastVerifiedDate || '',
    location: rawListing.location || { lat: 0, lng: 0 },
  } as Listing;
}
const ALLOWED_CATEGORY_SET: ReadonlySet<CanonicalCategory> = new Set(ALLOWED_CATEGORIES);
export function getListingsByCity(city: string): Listing[] {
  const allowedTypes = new Set(ALLOWED_CATEGORIES);
  const cityLower = city.trim().toLowerCase();
  const validTypes = ALLOWED_CATEGORIES;
  return listings
    .filter(raw => {
      const rawCity = typeof raw.city === 'string'
        ? raw.city
        : (raw.city && typeof raw.city === 'object' && 'name' in raw.city
            ? (raw.city as { name: string }).name
            : undefined);
      const type = normalizeCategory(raw.category ?? (raw as any).type);
      return rawCity && rawCity.trim().toLowerCase() === cityLower && allowedTypes.has(type);
    })
    .map(mapRawToListing);
}

type FilterOptions = {
  city?: string;
  // Accept both singular 'activity' and canonical 'activities' (BC)
  category?: CanonicalCategory | 'activity';
  hasEcoTags?: boolean;
  hasDnFeatures?: boolean;
};

export function filterListings(options: FilterOptions): Listing[] {
  // Start with all listings mapped to typed objects
  let result = listings.map(mapRawToListing);

  // Apply city filter if provided
  if (options.city) {
    const cityLower = options.city.trim().toLowerCase();
    result = result.filter((l) => l.city?.name.toLowerCase() === cityLower);
  }

  // Apply category filter if provided
  if (options.category) {
    const cat = normalizeCategory(options.category);
    result = result.filter((l) => l.type === cat);
  }

  // Apply eco-tags presence filter if requested
  if (options.hasEcoTags) {
    result = result.filter((l) => l.ecoFocusTags?.length > 0);
  }

  // Apply digital-nomad-features presence filter if requested
  if (options.hasDnFeatures) {
    result = result.filter((l) => l.digitalNomadFeatures?.length > 0);
  }

  // Finally enforce valid listing types
  const validTypes = ALLOWED_CATEGORY_SET;
  return result.filter((l) => l.type !== undefined && validTypes.has(l.type as CanonicalCategory));
}

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
                    name: String(review.user?.name ?? 'Anonymous'),
                    image: review.user?.image ?? undefined
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
