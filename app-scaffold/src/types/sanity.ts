// Typescript interfaces for Sanity data models
import { SanityImageAsset, SanityReference } from '@sanity/client';

// Sanity image type
export interface SanityImage {
  _type: 'image';
  asset: SanityReference<SanityImageAsset>;
  alt?: string;
  caption?: string;
}

// Common reference type with slug
export interface SanityReference {
  _id: string;
  name: string;
  slug?: { current: string };
}

// Base types for Sanity content
export interface SanityDocument {
  _id: string;
  _type: string;
  _createdAt: string;
  _updatedAt: string;
}

// Interface for listings from Sanity
export interface SanityListing extends SanityDocument {
  name: string;
  slug: string;  // This is pre-processed from slug.current
  category: 'coworking' | 'cafe' | 'accommodation';
  city: string;  // This is pre-processed from city->name
  addressString: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  descriptionShort: string;
  descriptionLong: string;
  ecoTags: string[];  // Pre-processed from ecoFocusTags[]->name
  ecoNotesDetailed: string;
  sourceUrls: string[];
  mainImage: SanityImage;
  galleryImages: SanityImage[];
  nomadFeatures: string[];  // Pre-processed from digitalNomadFeatures[]->name
  lastVerifiedDate: string;
  coworkingDetails?: {
    operatingHours: string;
    pricingPlans: any[];
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
