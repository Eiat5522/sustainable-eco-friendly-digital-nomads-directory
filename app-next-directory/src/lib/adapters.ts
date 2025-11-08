// This file adapts between different types of listing data formats
// For example, it helps convert listings.json data to the format expected by components
// or converts between the Listing type (from listing.ts) and the Listing type (from listings.ts)

import { Listing as SanityListing } from '@/types/listing';
import { JsonListing } from '@/types/sanity-compatible-json';
import { ListingCategory, PriceRange } from '@/types/enums';

/**
 * Converts a JSON listing format to the Sanity CMS listing format
 * @param jsonListing The listing from listings.json
 * @returns A listing in the Sanity format
 */
export function jsonToSanityListing(json: JsonListing): SanityListing {
  const now = new Date().toISOString();
  // Generate _id if missing, using name or fallback
  const _id = (json as { _id?: string })._id || (json.name ? `listing-${json.name.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  // Generate slug if missing, using name
  const slug = json.slug && typeof json.slug === 'object' && 'current' in json.slug
    ? json.slug
    : { current: (json.name ? json.name.toLowerCase().replace(/\s+/g, '-') : '') };

  // Map city to new structure
  const city = json.city
    ? {
        _id: (json.city as { _id?: string })._id || '',
        name: json.city.name || '',
        slug: typeof json.city.slug === 'object' && 'current' in json.city.slug
          ? json.city.slug
          : { current: typeof json.city.slug === 'string' ? json.city.slug : '' },
        listingCount: (json.city as { listingCount?: number }).listingCount || 0,
        country: (json.city as { country?: string }).country || ''
      }
    : undefined;

  // Map ecoTags to new structure
  const ecoTags = Array.isArray(json.ecoTags)
    ? json.ecoTags.map(tag => ({
        _id: (tag as { _id?: string })._id || '',
        name: tag.name || '',
        _type: 'reference' as const,
        slug: { current: tag.name ? tag.name.toLowerCase().replace(/\s+/g, '-') : '' },
        description: '',
        listingCount: 0
      }))
    : [];


  // Build location with coordinates if present
  let location;
  if (json.location && typeof json.location.lat === 'number' && typeof json.location.lng === 'number') {
    location = {
      lat: json.location.lat,
      lng: json.location.lng,
      coordinates: [json.location.lng, json.location.lat] as [number, number]
    };
  }

  return {
    _id,
    name: json.name,
    slug,

    city,
    type: (() => {
      switch (json.type) {
        case 'coworking': return ListingCategory.COWORKING;
        case 'cafe': return ListingCategory.CAFE;
        case 'accommodation': return ListingCategory.ACCOMMODATION;
        case 'restaurant': return ListingCategory.RESTAURANT;
        case 'activities': return ListingCategory.ACTIVITIES;
        default: return ListingCategory.COWORKING;
      }
    })(),
    address: json.address ?? '',
    shortDescription: json.shortDescription ?? '',
    longDescription: json.longDescription ?? '',
    ecoTags,

    sourceUrls: json.sourceUrls ?? [],
    primaryImage: json.primaryImage && json.primaryImage.asset ? { asset: { _ref: json.primaryImage.asset._ref || '', url: json.primaryImage.asset.url || '' } } : undefined,
    galleryImages: Array.isArray(json.galleryImages)
      ? json.galleryImages
          .map(img => img && img.asset ? { asset: { _ref: img.asset._ref || '', url: img.asset.url || '' } } : null)
          .filter((img): img is { asset: { _ref: string; url: string } } => !!img)
      : [],
    digitalNomadFeatures: json.digitalNomadFeatures ?? [],
    priceRange: json.priceRange as PriceRange | undefined,
    lastVerifiedDate: json.lastVerifiedDate ?? '',
    moderationStatus: 'pending',
    verificationStatus: 'unverified',
    ecoRating: undefined,
    location,
    coordinates: location?.coordinates as [number, number] | undefined,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Calculate an eco rating score between 0-100 based on the listing data
 */
export function calculateEcoRating(json: JsonListing): number {
  let score = 50;
  if (Array.isArray(json.ecoTags)) {
    score += Math.min(json.ecoTags.length * 10, 30);
  }
  if (typeof json.longDescription === 'string' && json.longDescription.length > 50) {
    score += 10;
  }
  if (Array.isArray(json.digitalNomadFeatures) && json.digitalNomadFeatures.length > 0) {
    score += 5;
  }
  return Math.min(score, 100);
}

