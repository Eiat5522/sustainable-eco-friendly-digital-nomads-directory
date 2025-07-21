// This file adapts between different types of listing data formats
// For example, it helps convert listings.json data to the format expected by components
// or converts between the Listing type (from listing.ts) and the Listing type (from listings.ts)

import { Listing as SanityListing } from '@/types/listing';
import { Listing as JsonListing } from '@/types/listings';
import { ListingCategory, PriceRange } from '@/types/enums';

/** Converts a JSON listing to the Sanity Listing type */
export function jsonToSanityListing(json: JsonListing): SanityListing {
  return {
    _id: json._id,
    name: json.name,
    slug: json.slug ?? json.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    shortDescription: json.shortDescription,
    longDescription: json.longDescription,
    type: json.type as ListingCategory,
    priceRange: undefined,
    priceIndication: json.cafeDetails?.priceIndication,
    mainImage: json.mainImage
      ? { asset: { _ref: json.mainImage, url: json.mainImage } }
      : undefined,
    galleryImages: json.galleryImages?.map((url) => ({ asset: { _ref: url, url } })),
    city: {
      _id: json.city.slug.current,
      name: json.city.name,
      slug: json.city.slug.current,
      listingCount: 0,
      country: ''
    },
    ecoTags: json.ecoTags.map((tag, idx) => ({
      _id: `${tag}-${idx}`,
      name: tag,
      slug: tag,
      description: json.ecoDetails,
      listingCount: 0,
      icon: undefined
    })),
    ecoRating: calculateEcoRating(json),
    location: json.coordinates
      ? {
          lat: json.coordinates.latitude ?? 0,
          lng: json.coordinates.longitude ?? 0,
          coordinates: [json.coordinates.latitude ?? 0, json.coordinates.longitude ?? 0]
        }
      : undefined,
    coordinates: json.coordinates
      ? [json.coordinates.latitude ?? 0, json.coordinates.longitude ?? 0]
      : undefined,
    address: json.address,
    rating: undefined,
    website: undefined,
    phone: undefined,
    email: undefined,
    socialLinks: undefined,
    hours: undefined,
    amenities: undefined,
    createdAt: json.lastVerifiedDate,
    updatedAt: json.lastVerifiedDate,
    price: undefined,
    // removed digitalNomadFeatures and sourceUrls to match Listing interface
  };
}

/** Calculate an eco rating score between 0-100 based on the listing data */
export function calculateEcoRating(json: JsonListing): number {
  let score = 50;
  score += Math.min(json.ecoTags.length * 10, 30);
  if (json.ecoDetails.length > 50) score += 10;
  if (json.digitalNomadFeatures.length > 0) score += 5;
  return Math.min(score, 100);
}
