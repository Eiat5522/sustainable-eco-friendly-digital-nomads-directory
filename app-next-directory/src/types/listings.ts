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

export const LISTING_WORKFLOW_STATUSES = ['published', 'unpublished', 'pending', 'draft'] as const;
export type ListingWorkflowStatus = (typeof LISTING_WORKFLOW_STATUSES)[number];

export const LISTING_MODERATION_STATES = ['pending', 'approved', 'rejected'] as const;
export type ListingModerationState = (typeof LISTING_MODERATION_STATES)[number];

export type ListingTypeValue = Listing['type'];
export const LISTING_TYPE_VALUES = ['coworking', 'cafe', 'accommodation', 'restaurant', 'activities'] as const satisfies readonly ListingTypeValue[];

export function isListingWorkflowStatus(value: unknown): value is ListingWorkflowStatus {
  return typeof value === 'string' && LISTING_WORKFLOW_STATUSES.some(status => status === value);
}

export function isListingModerationState(value: unknown): value is ListingModerationState {
  return typeof value === 'string' && LISTING_MODERATION_STATES.some(state => state === value);
}

export function isListingTypeValue(value: unknown): value is ListingTypeValue {
  return typeof value === 'string' && LISTING_TYPE_VALUES.some(type => type === value);
}

export interface ListingManagementItem {
  id: Listing['_id'];
  name: Listing['name'];
  slug: string;
  type: ListingTypeValue | 'unknown';
  status: ListingWorkflowStatus;
  createdAt: string;
  updatedAt: string | null;
  city: ListingCityName | null;
  moderationStatus: ListingModerationState | null;
  isFeatured: boolean;
}

export type ListingManagementFilters = {
  search: string;
  status: ListingWorkflowStatus | null;
  type: ListingManagementItem['type'] | null; // 'unknown' is only used in response data, not for filtering
};

export type ListingManagementPagination = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export interface ListingManagementResponse {
  listings: ListingManagementItem[];
  pagination: ListingManagementPagination;
  filters: ListingManagementFilters;
}
