/**
 * Types for JSON data that is compatible with Sanity CMS format
 * Used for data migration and conversion processes
 */

export interface JsonListing {
  _type: 'listing';
  name: string;
  slug: { current: string };
  type: string;
  shortDescription?: string;
  longDescription?: string;
  address?: string;
  website?: string;
  phone?: string;
  email?: string;
  location?: {
    lat: number;
    lng: number;
  };
  city?: {
    _id: string;
    name: string;
    slug: { current: string };
    listingCount: number;
    country: string;
  };
  primaryImage?: {
    _type: 'image';
    asset: {
      _ref: string;
      _type: 'reference';
      url: string;
    };
    alt: string;
  };
  galleryImages?: Array<{
    _type: 'image';
    asset: {
      _ref: string;
      _type: 'reference';
      url: string;
    };
    alt: string;
  }>;
  ecoTags?: Array<{
    _id: string;
    _type: 'reference';
    name: string;
  }>;
  ecoDetails?: {
    description?: string;
    ecoTags?: string[];
    certifications?: string[];
  };
  digitalNomadFeatures?: string[];
  sourceUrls?: string[];
  lastVerifiedDate?: string;
  priceRange?: string;
  operatingHours?: string;
  sustainabilityInitiatives?: string[];
  workFriendlyFeatures?: string[];
  accessibility?: {
    wheelchairAccessible?: boolean;
    accessibilityNotes?: string;
  };
  moderation?: {
    status?: string;
    verificationStatus?: string;
    featured?: boolean;
    moderatorNotes?: string;
  };
}