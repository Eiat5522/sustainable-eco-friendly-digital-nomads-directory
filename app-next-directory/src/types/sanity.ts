// Common types for Sanity schemas
export type CategoryType = 'coworking' | 'cafe' | 'accommodation';

// Base Sanity document interface
export interface SanityDocument {
  _id: string;
  _type: string;
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
}

// Image asset interface
export interface SanityImage {
  _type: 'image';
  asset: {
    _ref: string;
    _type: 'reference';
    url?: string;
  };
  alt?: string;
}

// Interface for listings from Sanity
export interface SanityListing extends SanityDocument {
  _type: 'listing';
  name: string;
  slug: string | { current: string }; // Updated to allow slug as string or object with current property
  description_short?: string;
  category?: CategoryType;
  city?: {
    _id: string;
    slug: string;
    title: string;
  };
  primaryImage?: SanityImage;
  ecoTags?: string[]; // Array of resolved tag names
  digital_nomad_features?: string[]; // Array of strings
  last_verified_date?: string;
  reviews?: number; // Count of reviews

  // Optional fields (can be present in full document, but not always in partials like cards)
  addressString?: string;
  description_long?: any; // Can be Portable Text
  galleryImages?: SanityImage[];
  website?: string;
  contactInfo?: string;
  openingHours?: string; // This might be structured
  ecoNotesDetailed?: string;
  sourceUrls?: string[];
  price?: number; // Added for compatibility with ListingCard and tests

  // Fields that were in listingFields previously, but removed for card view.
  // Still useful for a "full" SanityListing type.
  rating?: number;
  priceRange?: string;

  // Category specific details (optional)
  coworkingDetails?: {
    operatingHours?: string; // Keep optional if not always present
    pricingPlans?: Array<{
      type: string;
      price: number;
      period: string;
    }>;
    specificAmenities?: string[];
  };
  cafeDetails?: {
    operatingHours?: string; // Keep optional if not always present
    priceIndication?: string;
    menuHighlights?: string[];
    wifiReliabilityNotes?: string;
  };
  accommodationDetails?: {
    accommodationType?: string;
    pricePerNightRange?: { // Keep optional if not always present
      min?: number; // Make sub-fields optional too
      max?: number;
    };
    roomTypesAvailable?: string[];
    specificAmenities?: string[];
  };
}
