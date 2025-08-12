// src/lib/listings.ts
import listings from '../data/listings.json';
import { Listing } from '../types/listings';
import slugify from 'slugify';

// Function to map raw JSON to Listing objects
/**
 * TEMP legacy JSON -> Listing mapper (to be deprecated once all data served via Sanity DTO layer)
 */
import { toSlug } from './utils/slug';

function mapRawToListing(rawListing: any): Listing {

// drop empty _id – let the backend supply a stable id
  const ecoTagsRaw = rawListing.ecoFocusTags || rawListing.ecoTags || [];
  const ecoFocusTags = Array.isArray(ecoTagsRaw)
    ? ecoTagsRaw.map((t: any) => {
        const name = typeof t === 'string' ? t : t?.name;
        return name
          ? { name, slug: { current: toSlug(name) } }
          : null;
      }).filter(Boolean)
    : [];

  return {
    _id: rawListing.id || rawListing._id || '',
    name: rawListing.name || '',
    slug: typeof rawListing.slug === 'string'
      ? { current: rawListing.slug }
      : rawListing.slug || { current: '' },
    city: typeof rawListing.city === 'string'
      ? { name: rawListing.city, slug: { current: toSlug(rawListing.city) } }
      : rawListing.city || { name: '', slug: { current: '' } },
    type: rawListing.category === 'activities' ? 'activity' : (rawListing.category || rawListing.type || 'coworking'),
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
    digitalNomadFeatures: (rawListing.digitalNomadFeatures || []).map((feature: any) =>
      typeof feature === 'string' ? feature : feature?.name
    ).filter(Boolean),
    lastVerifiedDate: rawListing.lastVerifiedDate || '',
    location: rawListing.location || { lat: 0, lng: 0 },
  } as Listing;
}

export function getListingsByCity(city: string): Listing[] {
  const allowedTypes = new Set(['coworking', 'cafe', 'accommodation', 'activity', 'restaurant']);
  const cityLower = city.trim().toLowerCase();
  return listings
    .filter(raw => {
      const rawCity = typeof raw.city === 'string' ? raw.city : raw.city?.name;
      const type = raw.category === 'activities' ? 'activity' : (raw.category || raw.type || 'coworking');
      return rawCity && rawCity.trim().toLowerCase() === cityLower && allowedTypes.has(type);
    })
    .map(mapRawToListing);
}
}

type FilterOptions = {
  city?: string;
  category?: 'coworking' | 'cafe' | 'accommodation' | 'activity' | 'restaurant';
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
    result = result.filter((l) => l.type === options.category);
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
  const validTypes = ['coworking', 'cafe', 'accommodation', 'activity', 'restaurant'] as const;
  return result.filter((l) => l.type !== undefined && validTypes.includes(l.type));
}

// Maps a raw Sanity listing result to AppListingDetail DTO
import { AppListingDetail, AppListingCard } from '@/types/appView';

// Narrow unknown raw to Sanity listing-shaped object (not AppListingCard) with required fields
import type { SanityImage, SanityGalleryImage } from '@/types/appView';

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
};

export function isSanityListing(raw: any): raw is SanityListingRaw {
  const hasId = typeof raw?._id === 'string' && raw._id.trim().length > 0;
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
    slug: typeof raw.slug === 'string' ? raw.slug : raw.slug?.current || '',
    city: raw.city ? {
      id: raw.city._id || '',
      name: raw.city.name || '',
      slug: raw.city.slug?.current || '',
      country: raw.city.country
    } : null,
    ecoFocusTags: raw.ecoFocusTags,
    digitalNomadFeatures: raw.digitalNomadFeatures,
    priceRange: raw.priceRange,
    website: raw.website,
    primaryImage: raw.primaryImage,
    galleryImages: raw.galleryImages,          country: raw.city.country
        }
      : null,
    galleryImages: raw.galleryImages,
    shortDescription: raw.shortDescription,
    address: raw.address,
    category: raw.category,
    location: raw.location ? { lat: raw.location.lat, lng: raw.location.lng } : undefined,
    type: raw.type,
    ecoFocusTags: Array.isArray(raw.ecoFocusTags)
      ? raw.ecoFocusTags.map((tag: any) => (typeof tag === 'string' ? tag : tag?.name))
      : [],
  };
}

export function mapSanityListingToAppListingDetail(raw: SanityListingRaw): AppListingDetail {
  return {
    id: raw._id,
    name: raw.name,
    slug: typeof raw.slug === 'string' ? raw.slug : (raw.slug?.current ?? ''), // normalize to string
    city: raw.city
      ? {
          id: raw.city._id || '',
          name: raw.city.name || '',
          slug: typeof raw.city.slug === 'string' ? raw.city.slug : (raw.city.slug as any)?.current,
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
    ecoFocusTags: Array.isArray(raw.ecoFocusTags) ? raw.ecoFocusTags.map((tag: any) => (typeof tag === 'string' ? tag : tag?.name)) : [],
    priceRange: raw.priceRange,
    contactPhone: (raw as any).contactPhone,
    contactEmail: (raw as any).contactEmail,
    website: raw.website ?? undefined,
    shortDescription: raw.shortDescription,
    longDescription: raw.longDescription,
    lastVerifiedDate: (raw as any).lastVerifiedDate,
    reviews: Array.isArray(raw.reviews)
      ? raw.reviews
          .filter((review: any) => review && typeof review === 'object')
          .map((review: any) => ({
            id: review?._id ?? '',
            rating: review?.rating ?? null,
            comment: review?.comment ?? '',
            user:
              review?.user && typeof review.user === 'object'
                ? {
                    name: review.user?.name ?? '',
                    image: review.user?.image ?? ''
                  }
                : undefined,
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
    coworkingDetails: (raw as any).coworkingDetails,
    accommodationDetails: (raw as any).accommodationDetails,
    cafeDetails: (raw as any).cafeDetails,
    restaurantDetails: (raw as any).restaurantDetails,
    activitiesDetails: (raw as any).activitiesDetails,
    digitalNomadFeatures: Array.isArray(raw.digitalNomadFeatures) ? raw.digitalNomadFeatures.map((feature: any) => typeof feature === 'string' ? feature : feature?.name) : [],
  };
}
