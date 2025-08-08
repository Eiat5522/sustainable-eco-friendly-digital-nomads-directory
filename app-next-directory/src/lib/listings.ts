// src/lib/listings.ts
import listings from '../data/listings.json';
import { Listing } from '../types/listings';

// Function to map raw JSON to Listing objects
/**
 * TEMP legacy JSON -> Listing mapper (to be deprecated once all data served via Sanity DTO layer)
 */
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
    shortDescription: rawListing.shortDescription || '',
    longDescription: rawListing.longDescription || '',
    ecoFocusTags: rawListing.ecoFocusTags || [],
    // Handle both legacy string URLs and SanityImage objects
    primaryImage: normalizeImageField(rawListing.primaryImage, rawListing.primary_image_url),
    galleryImages: Array.isArray(rawListing.galleryImages) 
      ? rawListing.galleryImages.map((img: any) => 
          typeof img === 'string' ? { asset: { url: img } } : img
        )
      : rawListing.gallery_image_urls?.map((url: string) => ({ asset: { url } })) || [],
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
import { AppListingDetail, AppListingCard, AppCity } from '@/types/appView';

export function isSanityListing(raw: any): boolean {
  return !!raw && typeof raw === 'object' && typeof raw._id === 'string' && typeof raw.name === 'string';
}

export function mapSanityListingToCard(raw: any): AppListingCard {
  if (!isSanityListing(raw)) {
    throw new Error('Invalid Sanity listing object');
  }
  return {
    id: raw._id,
    name: raw.name || '',
    slug: typeof raw.slug === 'string' ? raw.slug : raw.slug?.current || '',
    city: raw.city && raw.city.name ? {
      id: raw.city._id || '',
      name: raw.city.name || '',
      slug: typeof raw.city.slug === 'string' ? raw.city.slug : raw.city.slug?.current || '',
      country: raw.city.country
    } : null,
    ecoFocusTags: Array.isArray(raw.ecoFocusTags) ? raw.ecoFocusTags.map((t: any) => typeof t === 'string' ? t : t?.name).filter(Boolean) : [],
    digitalNomadFeatures: Array.isArray(raw.digitalNomadFeatures) ? raw.digitalNomadFeatures.map((f: any) => typeof f === 'string' ? f : f?.name).filter(Boolean) : [],
    priceRange: raw.priceRange,
    website: raw.website || null,
    primaryImage: raw.primaryImage,
    galleryImages: raw.galleryImages,
    shortDescription: raw.shortDescription,
    address: raw.address,
    category: raw.category,
    location: raw.location ? { lat: raw.location.lat, lng: raw.location.lng } : undefined,
    type: raw.type
  };
}

export function mapSanityListingToAppListingDetail(raw: any): AppListingDetail {
  return {
    id: raw._id,
    name: raw.name,
    slug: typeof raw.slug === 'string' ? raw.slug : raw.slug?.current, // normalize to string
    city: raw.city
      ? {
          id: raw.city._id,
          name: raw.city.name,
          slug: raw.city.slug,
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
    ecoFocusTags: Array.isArray(raw.ecoFocusTags) ? raw.ecoFocusTags.map((tag: any) => tag.name) : [],
    priceRange: raw.priceRange,
    contactPhone: raw.contactPhone,
    contactEmail: raw.contactEmail,
    website: raw.website,
    shortDescription: raw.shortDescription,
    longDescription: raw.longDescription,
    reviews: Array.isArray(raw.reviews) ? raw.reviews.map((review: any) => ({
      id: review._id,
      rating: review.rating,
      comment: review.comment,
      user: review.user ? { name: review.user.name, image: review.user.image } : undefined,
      createdAt: review.createdAt,
    })) : [],
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
    digitalNomadFeatures: Array.isArray(raw.digitalNomadFeatures) ? raw.digitalNomadFeatures.map((feature: any) => feature.name) : [],
  };
}
