// This file adapts between different types of listing data formats
// For example, it helps convert listings.json data to the format expected by components
// or converts between the Listing type (from listing.ts) and the Listing type (from listings.ts)

import { Listing as SanityListing } from '@/types/listing';
import { JsonListing } from '@/types/sanity-compatible-json';

/**
 * Converts a JSON listing format to the Sanity CMS listing format
 * @param jsonListing The listing from listings.json
 * @returns A listing in the Sanity format
 */
export function jsonToSanityListing(json: JsonListing): SanityListing {
  const now = new Date().toISOString();
  const _id = json._id ?? (json.slug?.current ? `listing-${json.slug.current}` : undefined);

  // Build location with coordinates if present
  let location;
  if (json.location && typeof json.location.lat === 'number' && typeof json.location.lng === 'number') {
    location = {
      ...json.location,
      coordinates: [json.location.lng, json.location.lat]
    };
  }

  return {
    _id,
    name: json.name,
    slug: json.slug,
    city: json.city ? {
      name: json.city.name,
      slug: json.city.slug,
    } : undefined,
    type: (json.type === 'coworking' || json.type === 'cafe' || json.type === 'accommodation') ? json.type : undefined,
    address: json.address ?? '',
    shortDescription: json.shortDescription ?? '',
    longDescription: json.longDescription ?? '',
    ecoTags: Array.isArray(json.ecoTags)
      ? json.ecoTags.map(tag => ({
          _id: tag._id,
          name: tag.name,
          slug: { current: tag.name.toLowerCase().replace(/\s+/g, '-') },
        }))
      : [],
    ecoDetails: json.ecoDetails ?? {},
    sourceUrls: json.sourceUrls ?? [],
    mainImage: json.mainImage?.asset?.url ?? '',
    galleryImages: Array.isArray(json.galleryImages)
      ? json.galleryImages.map(img => img.asset?.url ?? '')
      : [],
    digitalNomadFeatures: json.digitalNomadFeatures ?? [],
    lastVerifiedDate: json.lastVerifiedDate ?? '',
    moderationStatus: 'pending',
    verificationStatus: 'unverified',
    ecoRating: undefined,
    coordinates: json.location
      ? { latitude: json.location.lat, longitude: json.location.lng }
      : undefined,
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

