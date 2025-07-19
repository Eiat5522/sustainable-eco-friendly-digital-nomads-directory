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
    _id: jsonListing.id,
    name: jsonListing.name,
    slug: jsonListing.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: jsonListing.description_long,
    type: jsonListing.category as any, // Type conversion between the two formats
    priceRange: 'moderate', // Default value
    price_indication: 'moderate', // Required field
    mainImage: {
      asset: {
        _ref: 'image-reference',
        url: jsonListing.primary_image_url
      }
    },
    city: {
      _id: 'city-id',
      name: jsonListing.city,
      slug: jsonListing.city.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      listingCount: 0,
      country: 'Thailand'
    },
    ecoTags: jsonListing.eco_focus_tags.map((tag, index) => ({
      _id: `tag-${index}`,
      name: tag.replace(/_/g, ' '),
      slug: tag,
      description: '',
      listingCount: 0
    })),
    ecoRating: calculateEcoRating(jsonListing),
    location: (jsonListing as any).coordinates
              ? {
                  lat: (jsonListing as any).coordinates.latitude || 0,
                  lng: (jsonListing as any).coordinates.longitude || 0,
                  coordinates: [
                    (jsonListing as any).coordinates.latitude || 0,
                    (jsonListing as any).coordinates.longitude || 0
                  ]
                }
              : {
                  lat: 0,
                  lng: 0,
                  coordinates: [0, 0]
                },
    address: jsonListing.address_string,
    rating: 4.5, // Default rating
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Calculate an eco rating score between 0-100 based on the listing data
 */
export function calculateEcoRating(listing: JsonListing): number {
  // Base score starting at 50
  let score = 50;
  
  // Add points for each eco tag (max 30 points)
  score += Math.min(listing.eco_focus_tags.length * 10, 30);
  
  // Add points if it has detailed eco notes
  if (listing.eco_notes_detailed && listing.eco_notes_detailed.length > 50) {
    score += 10;
  }
  
  // Add points for digital nomad features
  if (listing.digital_nomad_features && listing.digital_nomad_features.length > 0) {
    score += 5;
  }
  
  // Cap the score at 100
  return Math.min(score, 100);
}
