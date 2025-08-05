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
    ecoTags: (rawListing.ecoTags || []).map((tag: any) => 
      typeof tag === 'string' ? { _id: tag, name: tag, slug: { current: tag.toLowerCase().replace(/\s+/g, '-') }, description: '' } : tag
    ),
    sourceUrls: rawListing.sourceUrls || [],
    mainImage: rawListing.primary_image_url || rawListing.mainImage || '',
    galleryImages: rawListing.gallery_image_urls || rawListing.galleryImages || [],
    digitalNomadFeatures: rawListing.digitalNomadFeatures || [],
    lastVerifiedDate: rawListing.lastVerifiedDate || '',
    coordinates: rawListing.coordinates || { latitude: 0, longitude: 0 },
    ecoDetails: {
      description: rawListing.ecoNotesDetailed || '',
      ecoTags: rawListing.ecoTags || [],
      certifications: []
    }
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
        if (!listing.ecoTags || listing.ecoTags.length === 0) {
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
import { AppListingDetail, AppCity } from '@/types/appView';

export function mapSanityListingToAppListingDetail(raw: any): AppListingDetail {
  return {
    id: raw._id,
    name: raw.name,
    slug: raw.slug,
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
    coordinates: raw.location
      ? { lat: raw.location.lat, lng: raw.location.lng }
      : undefined,
    primaryImage: raw.primaryImage,
    galleryImages: raw.galleryImages,
    ecoTags: Array.isArray(raw.ecoFocusTags) ? raw.ecoFocusTags.map((tag: any) => tag.name) : [],
    priceRange: raw.priceRange,
    contactPhone: raw.contactPhone,
    contactEmail: raw.contactEmail,
    website: raw.website,
    shortDescription: raw.shortDescription,
    longDescription: raw.longDescription,
    reviews: (raw.reviews || []).map((review: any) => ({
      id: review._id,
      rating: review.rating,
      comment: review.comment,
      user: review.user ? { id: review.user._id, name: review.user.name } : null,
      createdAt: review.createdAt,
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
  };
}
