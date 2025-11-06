import type { SanityImage, SanityGalleryImage } from './appView';

export type GalleryImage = SanityGalleryImage | SanityImage;
export interface PricingPlan {
  name: string;
  price: number;
  duration: string;
  features: string[];
}

export interface Coordinates {
  latitude: number | null;
  longitude: number | null;
}

export interface EcoTag {
  _id: string;
  name: string;
  slug: { current: string };
  description?: string;
}

export interface Listing {
  _id: string;
  slug?: { current: string };
  name: string;
  city: {
    name: string;
    slug: { current: string };
  };
  type: 'coworking' | 'cafe' | 'accommodation' | 'restaurant' | 'activities' ;
  address: string;
  shortDescription: string;
  longDescription: string;
  ecoFocusTags: EcoTag[];
  primaryImage?: SanityImage;
  galleryImages?: GalleryImage[];
  priceRange?: string;
  website?: string;
  category?: string; // Resolved conflict: keeping this line
  digitalNomadFeatures: string[];
  lastVerifiedDate: string;
  moderationStatus?: string;
  verificationStatus?: string;
  ecoRating?: number;
  coordinates?: Coordinates;
  location?: { lat: number; lng: number };
  coworkingDetails?: {
    operatingHours: string | null;
    pricingPlans: PricingPlan[];
    specificAmenitiesCoworking: string[];
  };
  cafeDetails?: {
    operatingHours: string;
    priceIndication: string;
    menuHighlightsCafe: string[];
    wifiReliabilityNotes: string;
  };
  accommodationDetails?: {
    accommodationType: string;
    pricePerNightThbRange: {
      min: number;
      max: number;
    };
    roomTypesAvailable: string[];
    specificAmenitiesAccommodation: string[];
  };
}

type ListingCityName = Listing['city'] extends { name: infer Name }
  ? Name
  : string;

type ListingModerationStatus = Extract<Listing['moderationStatus'], string>;
type ListingVerificationStatus = Extract<Listing['verificationStatus'], string>;

/**
 * Minimal listing projection used by venue owners when managing their venues.
 *
 * Derives from the primary {@link Listing} interface to guarantee that shared
 * fields such as `_id` and `name` stay in sync with the source-of-truth data
 * model. Additional properties reflect the flattened shape returned by the
 * listings management API.
 */
export type ListingManagementSummary = Pick<Listing, '_id' | 'name'> & {
  city: ListingCityName;
  status: ListingModerationStatus | ListingVerificationStatus | string;
};
