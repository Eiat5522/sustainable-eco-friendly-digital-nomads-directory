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
  name: string;
  slug: string;  // This is pre-processed from slug.current
  category: CategoryType;
  city: {
    name: string;
    country: string;
  };
  address: string;  // Updated to match camelCase field
  descriptionShort: string;
  descriptionLong?: string;
  ecoTags: string[];  // Pre-processed from ecoFocusTags[]->name
  ecoNotesDetailed?: string;
  sourceUrls?: string[];
  mainImage: SanityImage;
  galleryImages?: SanityImage[];
  digitalNomadFeatures: string[];  // Updated to match camelCase field
  lastVerifiedDate?: string;
  rating: number;
  priceRange?: string;
  website?: string;
  contactInfo?: string;
  openingHours?: string;
  status: string;  // Added status field
  coworkingDetails?: {
    operatingHours: string;
    pricingPlans: Array<{
      type: string;
      price: number;
      period: string;
    }>;
    specificAmenities: string[];
  };
  cafeDetails?: {
    operatingHours: string;
    priceIndication: string;
    menuHighlights: string[];
    wifiReliabilityNotes: string;
  };
  accommodationDetails?: {
    accommodationType: string;
    pricePerNightRange: {
      min: number;
      max: number;
    };
    roomTypesAvailable: string[];
    specificAmenities: string[];
  };
}