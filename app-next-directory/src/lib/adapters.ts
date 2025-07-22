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
    type: json.type ?? json._type ?? 'listing',
    createdAt: now,
    updatedAt: now,
    name: json.name,
    slug: json.slug,
    shortDescription: json.shortDescription,
    longDescription: json.longDescription,
    address: json.address,
    website: json.website,
    phone: json.phone,
    email: json.email,
    city: json.city,
    location,
    mainImage: json.mainImage
      ? { asset: { _ref: '', url: json.mainImage } }
      : undefined,
    galleryImages: json.galleryImages
      ? json.galleryImages.map((url: string) => ({ asset: { _ref: '', url } }))
      : undefined,
    ecoTags: json.ecoTags,
    digitalNomadFeatures: json.digitalNomadFeatures,
    priceRange: json.priceRange,
    lastVerifiedDate: json.lastVerifiedDate,
    sourceUrls: json.sourceUrls,
    ecoRating: json.ecoRating,
    moderationStatus: json.moderationStatus ?? 'pending',
    verificationStatus: json.verificationStatus ?? 'unverified',
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

