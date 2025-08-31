// ===== 2. DTO TYPES =====
// File: src/types/dto.ts
// Clean, frontend-optimized data shapes

export interface ImageDimensionsDTO {
  width?: number;
  height?: number;
}

export interface CityDTO {
  id: string;
  name: string;
  slug: string;
  country: string;
  /** 0–100 sustainability index; higher is better */
  sustainabilityScore?: Percentage0To100;
  highlights?: string[];
  imageUrl?: string | null;
  imageDimensions?: ImageDimensionsDTO | null;
  description?: string;
}

// Extended DTO for city detail pages with additional information
export interface CityDetailDTO extends CityDTO {
  // Additional detail fields
  shortDescription?: string;
  airQuality?: string;
  /** If number, interpreted as average download Mbps. Prefer InternetSpeedDTO when available. */
  internetSpeed?: InternetSpeedValue;
  costOfLiving?: string;
  climate?: string;
  safety?: string;
  walkability?: string;
  sustainabilityInitiatives?: string[];
  digitalNomadFeatures?: string[];
  galleryImages?: string[];
}

export interface AmenityDTO {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  category?: string;
}

// Base DTO - common fields for all listing displays
export interface BaseListingDTO {
  id: string;
  name: string;
  slug: string;
  type: 'coworking' | 'cafe' | 'accommodation' | 'restaurant' | 'activities';
  city: CityDTO | null;
  imageUrl?: string;
  ecoFocusTags?: string[];
  /** @deprecated Use `ecoFocusTags` (plural). Temporary alias for backward compatibility. */
  ecoFocusTags?: string[];
  digitalNomadFeatures?: string[];
  priceRange?: 'budget' | 'moderate' | 'premium';
  website?: string;
  address?: string;
  location?: GeoPoint;
  // Canonical fields aligned with backend
  status?: ListingStatusDTO;
  verification?: VerificationStatusDTO;
  lastVerifiedAt?: string; // ISO datetime string
  featured?: boolean;
}
export type GeoPoint = Readonly<{ lat: number; lng: number }>;

// Shared internet speed shape (readonly)
export type InternetSpeedDTO = Readonly<{
  download: number; // Mbps
  upload: number;   // Mbps
  lastTested?: string; // ISO datetime
}>;

/** Shorthand union for places that accept a simple Mbps number or the full shape */
export type InternetSpeedValue = number | InternetSpeedDTO;

// Canonical backend-aligned enums
export type ListingStatusDTO = 'draft' | 'pending' | 'published' | 'archived' | 'flagged';
export type VerificationStatusDTO = 'unverified' | 'verified' | 'needs_verification';
// Moderation is used mainly for reviews; included here for completeness in downstream DTOs if needed
export type ModerationStatusDTO = 'pending' | 'approved' | 'rejected' | 'changes_needed' | 'flagged';

/** 0–100 sustainability index; higher is better */
export type Percentage0To100 = number & { __brand: 'Percentage0To100' };

/** Monetary value used across DTOs */
export type Money = {
  amount: number;
  currency: string;
  unit?: 'night' | 'meal' | 'hour';
};

/** Standard opening hours structure */
export type OpeningHour = { day: string; opens: string; closes: string };

// Lightweight DTO for cards/lists
export interface ListingSummaryDTO extends BaseListingDTO {
  shortDescription?: string;
  amenityNames?: string[]; // Just names for display
}

// Featured listings DTO (minimal fields for homepage)
export type FeaturedListingDTO = Pick<BaseListingDTO, 'id' | 'name' | 'slug' | 'imageUrl'> & {
  city: string;          // Just city name for simple display
  amenityNames: string[]; // Just amenity names
};

// Full detail DTO as a discriminated union keyed by `type`
export interface CoworkingDetails {
  pricingPlans?: Array<{ type: string; price: Money; period: string; features?: string[] }>;
  openingHours?: OpeningHour[];
  internetSpeed?: InternetSpeedDTO;
}

export interface CafeDetails {
  openingHours?: OpeningHour[];
  priceIndication?: string;
  menuHighlights?: string[];
  noiseLevel?: string;
  workPolicy?: { laptopsAllowed?: boolean; timeLimit?: number };
}

export interface RestaurantDetails {
  cuisineType?: string[];
  operatingHours?: OpeningHour[];
  dietaryOptions?: string[];
  averageMealPrice?: Money;
}

export interface ActivityDetails {
  activityType?: string;
  duration?: string;
  skillLevel?: string;
  languages?: string[];
}

export interface AccommodationDetails {
  accommodationType?: string;
  pricePerNight?: Money;
  roomTypes?: string[];
  minimumStay?: number;
}

export interface ListingDetailShared extends BaseListingDTO {
  shortDescription?: string;
  longDescription?: string;
  galleryImages: string[]; // Pre-processed URLs
  amenities: AmenityDTO[];
  contactPhone?: string;
  contactEmail?: string;
}

export type ListingDetailDTO =
  | (ListingDetailShared & {
      type: 'coworking';
      coworkingDetails: CoworkingDetails;
      cafeDetails?: never; restaurantDetails?: never; activityDetails?: never; accommodationDetails?: never;
    })
  | (ListingDetailShared & {
      type: 'cafe';
      cafeDetails: CafeDetails;
      coworkingDetails?: never; restaurantDetails?: never; activityDetails?: never; accommodationDetails?: never;
    })
  | (ListingDetailShared & {
      type: 'restaurant';
      restaurantDetails: RestaurantDetails;
      coworkingDetails?: never; cafeDetails?: never; activityDetails?: never; accommodationDetails?: never;
    })
  | (ListingDetailShared & {
      type: 'activities';
      activityDetails: ActivityDetails;
      coworkingDetails?: never; cafeDetails?: never; restaurantDetails?: never; accommodationDetails?: never;
    })
  | (ListingDetailShared & {
      type: 'accommodation';
      accommodationDetails: AccommodationDetails;
      coworkingDetails?: never; cafeDetails?: never; restaurantDetails?: never; activityDetails?: never;
    });
