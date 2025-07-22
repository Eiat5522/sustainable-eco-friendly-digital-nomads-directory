// This file adapts between different types of listing data formats
// For example, it helps convert listings.json data to the format expected by components
// or converts between the Listing type (from listing.ts) and the Listing type (from listings.ts)

import { Listing as SanityListing } from '@/types/listing';
import { Listing as JsonListing } from '@/types/listings';

/**
 * Converts a JSON listing format to the Sanity CMS listing format
 * @param jsonListing The listing from listings.json
 * @returns A listing in the Sanity format
 */
export function jsonToSanityListing(jsonListing: JsonListing): SanityListing {
  return {
    _id: jsonListing._id,
    name: jsonListing.name,
    slug: jsonListing.slug || jsonListing.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    shortDescription: jsonListing.shortDescription,
    longDescription: jsonListing.longDescription,
    type: jsonListing.type,
    mainImage: jsonListing.mainImage
      ? { asset: { _ref: '', url: jsonListing.mainImage } }
      : undefined,
    galleryImages: jsonListing.galleryImages
      ? jsonListing.galleryImages.map((url: string) => ({ asset: { _ref: '', url } }))
      : undefined,
    city: {
      _id: jsonListing.city.slug,
      name: jsonListing.city.name,
      slug: jsonListing.city.slug,
      listingCount: 0,
      country: ''
    },
    ecoRating: calculateEcoRating(jsonListing),
    location: jsonListing.coordinates
      ? {
          lat: jsonListing.coordinates.latitude || 0,
          lng: jsonListing.coordinates.longitude || 0,
          coordinates: [jsonListing.coordinates.latitude || 0, jsonListing.coordinates.longitude || 0]
        }
      : undefined,
    address: jsonListing.address,
    rating: undefined,
    createdAt: jsonListing.lastVerifiedDate,
    updatedAt: jsonListing.lastVerifiedDate,
    digitalNomadFeatures: jsonListing.digitalNomadFeatures,
    ecoNotesDetailed: jsonListing.ecoDetails,
    sourceUrls: jsonListing.sourceUrls
  };
}

/**
 * Calculate an eco rating score between 0-100 based on the listing data
 */
export function calculateEcoRating(listing: JsonListing): number {
  // Base score starting at 50
  let score = 50;

  // Add points for each eco tag (max 30 points)
  const ecoTags = listing.ecoTags || listing.ecoTags || [];
  score += Math.min(ecoTags.length * 10, 30);

  // Add points if it has detailed eco notes
  const ecoNotes = listing.ecoNotes || listing.eco_notes_detailed || '';
  if (ecoNotes && ecoNotes.length > 50) {
    score += 10;
  }

  // Add points for digital nomad features
  const digitalNomadFeatures = listing.digitalNomadFeatures || listing.digitalNomadFeatures || [];
  if (digitalNomadFeatures && digitalNomadFeatures.length > 0) {
    score += 5;
  }

  // Cap the score at 100
  return Math.min(score, 100);
}
export function calculateEcoRating(listing: JsonListing): number {
  let score = 50;
  // Add points for each eco tag (max 30 points)
  score += Math.min(listing.ecoTags.length * 10, 30);
  // Points for detailed eco notes
  if (listing.ecoDetails && listing.ecoDetails.length > 50) {
    score += 10;
  }
  // Points for digital nomad features
  if (listing.digitalNomadFeatures && listing.digitalNomadFeatures.length > 0) {
    score += 5;
  }
  return Math.min(score, 100);
}
