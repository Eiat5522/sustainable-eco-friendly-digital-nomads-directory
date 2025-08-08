// src/lib/listings.ts
import listings from '../data/listings.json';
import { Listing } from '../types/listings';

// Function to map raw JSON to Listing objects
function mapRawToListing(rawListing: any): Listing {
  return {
    _id: rawListing.id || rawListing._id || '',
    name: rawListing.name || '',
    slug: typeof rawListing.slug === 'string' 
      ? { current: rawListing.slug } 
      : rawListing.slug || { current: '' },
    city: typeof rawListing.city === 'string'
      ? { name: rawListing.city, slug: { current: rawListing.city.toLowerCase().replace(/\s+/g, '-') } }
      : rawListing.city || { name: '', slug: { current: '' } },
    type: rawListing.category || rawListing.type || 'coworking',
    address: rawListing.address || '',
    shortDescription: rawListing.shortDescription || rawListing.shortDescription || '',
    longDescription: rawListing.longDescription || rawListing.longDescription || '',
    mainImage: rawListing.primary_image_url || rawListing.mainImage || '',
    galleryImages: rawListing.gallery_image_urls || rawListing.galleryImages || [],
    ecoFocusTags: (rawListing.ecoFocusTags || []).map((tag: any) =>
      typeof tag === 'string' ? tag : tag.name
    ),
    digitalNomadFeatures: (rawListing.digitalNomadFeatures || []).map((feature: any) =>
      typeof feature === 'string' ? feature : feature.name
    ),
    lastVerifiedDate: rawListing.lastVerifiedDate || '',
    location: rawListing.location || { lat: 0, lng: 0 },
  };
}

export function getListingsByCity(city: string): Listing[] {
  return listings
    .map(mapRawToListing)  // First map to typed Listing objects
    .filter((listing) =>
      !!listing.city &&
      listing.city.name?.toLowerCase() === city.trim().toLowerCase() &&
      (listing.type === 'coworking' ||
        listing.type === 'cafe' ||
        listing.type === 'accommodation')
    );
}

type FilterOptions = {
  city?: string;
  category?: 'coworking' | 'cafe' | 'accommodation';
  hasEcoTags?: boolean;
  hasDnFeatures?: boolean;
};

export function filterListings(options: FilterOptions): Listing[] {
  return listings
    .map(mapRawToListing)  // First map to typed Listing objects
    .filter((listing) => {
      if (options.city) {
        if (!listing.city || listing.city.name?.toLowerCase() !== options.city.trim().toLowerCase()) {
          return false;
        }
      }
      if (options.category) {
        if (listing.type !== options.category) {
          return false;
        }
      }
      if (options.hasEcoTags) {
        if (!listing.ecoFocusTags || listing.ecoFocusTags.length === 0) {
          return false;
        }
      }
      if (options.hasDnFeatures) {
        if (!listing.digitalNomadFeatures || listing.digitalNomadFeatures.length === 0) {
          return false;
        }
      }
      // Ensure type is valid for Listing type
      return (
        listing.type === 'coworking' ||
        listing.type === 'cafe' ||
        listing.type === 'accommodation' ||
        listing.type === 'activity' ||
        listing.type === 'restaurant'
      );
    });
}

// Maps a raw Sanity listing result to AppListingDetail DTO
import { AppListingDetail, AppListingCard, AppCity, SanityImage, SanityGalleryImage } from '@/types/appView';
import type { Listing as SanityListing, City as SanityCity } from '@/types/sanity.types';

/**
 * Type guard to check if an object is a valid Sanity listing
 */
export function isSanityListing(obj: any): obj is SanityListing {
  return obj && typeof obj === 'object' && obj._type === 'listing' && obj._id;
}

/**
 * Type guard to check if an object is a valid Sanity city
 */
export function isSanityCity(obj: any): obj is SanityCity {
  return obj && typeof obj === 'object' && obj._type === 'city' && obj._id;
}

/**
 * Map a Sanity city to AppCity DTO
 */
export function mapSanityCity(city: any): AppCity | null {
  if (!city) return null;
  
  return {
    id: city._id,
    name: city.name || '',
    slug: typeof city.slug === 'string' ? city.slug : city.slug?.current || '',
    country: city.country,
    sustainabilityScore: city.sustainabilityScore,
    highlights: city.highlights || [],
    mainImage: city.mainImage || city.image || null
  };
}

/**
 * Map a Sanity listing to AppListingCard DTO
 */
export function mapSanityListingToCard(raw: any): AppListingCard {
  if (!raw) {
    throw new Error('Cannot map null or undefined listing');
  }

  return {
    id: raw._id,
    name: raw.name || '',
    slug: typeof raw.slug === 'string' ? raw.slug : raw.slug?.current || '',
    city: raw.city ? mapSanityCity(raw.city) : null,
    type: raw.type,
    category: raw.category,
    address: raw.address,
    location: raw.location
      ? { lat: raw.location.lat, lng: raw.location.lng }
      : undefined,
    primaryImage: raw.primaryImage || null,
    galleryImages: Array.isArray(raw.galleryImages) ? raw.galleryImages : [],
    ecoFocusTags: Array.isArray(raw.ecoFocusTags) 
      ? raw.ecoFocusTags.map((tag: any) => typeof tag === 'string' ? tag : tag.name).filter(Boolean)
      : [],
    digitalNomadFeatures: Array.isArray(raw.digitalNomadFeatures)
      ? raw.digitalNomadFeatures.map((feature: any) => typeof feature === 'string' ? feature : feature.name).filter(Boolean)
      : [],
    priceRange: raw.priceRange,
    website: raw.website,
    shortDescription: raw.shortDescription,
    imageUrl: raw.imageUrl, // For backward compatibility
  };
}

export function mapSanityListingToAppListingDetail(raw: any): AppListingDetail {
  const baseCard = mapSanityListingToCard(raw);
  
  return {
    ...baseCard,
    contactPhone: raw.contactPhone,
    contactEmail: raw.contactEmail,
    longDescription: raw.longDescription,
    reviews: (raw.reviews || []).map((review: any) => ({
      id: review._id,
      listingId: raw._id,
      userId: review.user?._id || '',
      rating: review.rating || 0,
      comment: review.comment || '',
      createdAt: review.createdAt || new Date().toISOString(),
      user: {
        name: review.user?.name || 'Anonymous',
        image: review.user?.image || undefined,
      },
    })),
    amenities: (raw.amenities || []).map((amenity: any) => ({
      id: amenity._id,
      name: amenity.name,
      description: amenity.description,
      badge: amenity.badge,
    })),
    coworkingDetails: raw.coworkingDetails,
    accommodationDetails: raw.accommodationDetails,
    cafeDetails: raw.cafeDetails,
    restaurantDetails: raw.restaurantDetails,
    activitiesDetails: raw.activitiesDetails,
    lastVerifiedDate: raw.lastVerifiedDate,
  };
}
