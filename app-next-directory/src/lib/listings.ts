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
    type: rawlisting.type || rawListing.type || 'coworking',
    address: rawListing.address_string || rawListing.address || '',
    shortDescription: rawListing.shortDescription || rawListing.shortDescription || '',
    longDescription: rawListing.longDescription || rawListing.longDescription || '',
    ecoTags: (rawListing.eco_focus_tags || rawListing.ecoTags || []).map((tag: any) => 
      typeof tag === 'string' ? { _id: tag, name: tag, slug: { current: tag.toLowerCase().replace(/\s+/g, '-') }, description: '' } : tag
    ),
    sourceUrls: rawListing.source_urls || rawListing.sourceUrls || [],
    mainImage: rawListing.primary_image_url || rawListing.mainImage || '',
    galleryImages: rawListing.gallery_image_urls || rawListing.galleryImages || [],
    digitalNomadFeatures: rawListing.digital_nomad_features || rawListing.digitalNomadFeatures || [],
    lastVerifiedDate: rawListing.last_verified_date || rawListing.lastVerifiedDate || '',
    coordinates: rawListing.coordinates || { latitude: 0, longitude: 0 },
    ecoDetails: {
      description: rawListing.eco_notes_detailed || '',
      ecoTags: rawListing.eco_focus_tags || [],
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
        listing.type === 'accommodation'
      );
    });
}
