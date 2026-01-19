// ===== 2. DTO TYPES =====
// File: src/types/dto.ts
// Clean, frontend-optimized data shapes

import type { UserRole } from './auth';

export type { UserRole } from './auth';

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
  upload: number; // Mbps
  lastTested?: string; // ISO datetime
}>;

/** Shorthand union for places that accept a simple Mbps number or the full shape */
export type InternetSpeedValue = number | InternetSpeedDTO;

// Canonical backend-aligned enums
export type ListingStatusDTO = 'draft' | 'pending' | 'published' | 'archived' | 'flagged';
export type VerificationStatusDTO = 'unverified' | 'verified' | 'needs_verification';
// Moderation is used mainly for reviews; included here for completeness in downstream DTOs if needed
export type ModerationStatusDTO =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'changes_needed'
  | 'flagged';

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
  city: string;
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
      cafeDetails?: never;
      restaurantDetails?: never;
      activityDetails?: never;
      accommodationDetails?: never;
    })
  | (ListingDetailShared & {
      type: 'cafe';
      cafeDetails: CafeDetails;
      coworkingDetails?: never;
      restaurantDetails?: never;
      activityDetails?: never;
      accommodationDetails?: never;
    })
  | (ListingDetailShared & {
      type: 'restaurant';
      restaurantDetails: RestaurantDetails;
      coworkingDetails?: never;
      cafeDetails?: never;
      activityDetails?: never;
      accommodationDetails?: never;
    })
  | (ListingDetailShared & {
      type: 'activities';
      activityDetails: ActivityDetails;
      coworkingDetails?: never;
      cafeDetails?: never;
      restaurantDetails?: never;
      accommodationDetails?: never;
    })
  | (ListingDetailShared & {
      type: 'accommodation';
      accommodationDetails: AccommodationDetails;
      coworkingDetails?: never;
      cafeDetails?: never;
      restaurantDetails?: never;
      activityDetails?: never;
    });

// ===== Dashboard DTOs =====

export interface DashboardListingInfoDTO {
  id: string;
  name: string;
  slug?: string | null;
  city?: string | null;
}

export interface DashboardTimeSeriesPointDTO {
  month: string; // YYYY-MM
  label: string; // e.g., "Jan 2024"
  reviewCount: number;
  avgRating: number | null;
  favoritesCount: number;
  /** Monthly views recorded for this period; null when analytics are unavailable */
  monthlyViewCount: number | null;
}

export interface DashboardListingSummaryDTO {
  listing: DashboardListingInfoDTO;
  summary: {
    avgRating: number | null;
    reviewCount: number;
    favoritesCount: number;
    viewCount: number | null;
  };
  monthly: DashboardTimeSeriesPointDTO[];
  lastUpdated?: string | null;
}

export interface VenueOwnerDashboardDTO {
  kind: 'venueOwner';
  listings: DashboardListingSummaryDTO[];
  totals: {
    avgRating: number | null;
    reviewCount: number;
    favoritesCount: number;
    viewCount: number | null;
  };
  monthlyTotals: DashboardTimeSeriesPointDTO[];
  notices: string[];
}

export interface UserDashboardFavoriteDTO {
  id: string;
  createdAt: string;
  listing: DashboardListingInfoDTO;
}

export interface RegularUserDashboardDTO {
  kind: 'user';
  favorites: UserDashboardFavoriteDTO[];
  metrics: {
    favoritesCount: number;
    reviewsWritten: number;
    avgRatingGiven: number | null;
  };
  monthly: DashboardTimeSeriesPointDTO[];
}

export interface UserDashboardPayloadDTO {
  user: {
    id: string;
    role: UserRole;
    name?: string | null;
    email?: string | null;
  };
  generatedAt: string;
  range: {
    months: number;
    from: string;
    to: string;
  };
  data: VenueOwnerDashboardDTO | RegularUserDashboardDTO;
}

// ===== Analytics DTOs =====

export interface UserAnalyticsSummaryDTO {
  avgRating: number | null;
  reviewCount: number;
  favoritesCount: number;
  viewCount: number | null;
}

export interface VenueOwnerAnalyticsDTO {
  kind: 'venueOwner';
  summary: UserAnalyticsSummaryDTO;
  monthly: DashboardTimeSeriesPointDTO[];
}

export interface RegularUserAnalyticsDTO {
  kind: 'user';
  summary: {
    avgRating: number | null;
    reviewCount: number;
    favoritesCount: number;
  };
  monthly: DashboardTimeSeriesPointDTO[];
}

export interface UserAnalyticsPayloadDTO {
  user: {
    id: string;
    role: UserRole;
  };
  generatedAt: string;
  range: {
    months: number;
    from: string;
    to: string;
  };
  data: VenueOwnerAnalyticsDTO | RegularUserAnalyticsDTO;
}

// ===== Blog DTOs =====
import type { PortableTextBlock } from './external/portabletext';

export interface BlogSummaryDTO {
  id: string;
  title: string;
  slug: string; // normalized string slug
  excerpt?: string;
  imageUrl?: string;
  imageDimensions?: ImageDimensionsDTO;
  tags?: string[];
  authorName?: string;
  publishedAt?: ISODateString; // ISO datetime
  readingTime?: number; // minutes
}
export type ISODateString = string & { __brand: 'ISODateString' };

/** UNSAFE: Casts without validating. Prefer isISODateString/assertISODateString. */
export const asISODateString = (s: string): ISODateString => s as ISODateString;

// Accepts YYYY-MM-DD or full ISO 8601 date-time with optional timezone
const ISO_DATE_TIME_RE =
  /^\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

export const isISODateString = (s: string): s is ISODateString => ISO_DATE_TIME_RE.test(s);

export function assertISODateString(s: string): asserts s is ISODateString {
  if (!isISODateString(s)) throw new TypeError('Invalid ISO 8601 date/time string');
}

export interface BlogDetailDTO extends BlogSummaryDTO {
  body: ReadonlyArray<PortableTextBlock>;
  authorImageUrl?: string | null;
  relatedPosts?: ReadonlyArray<
    Pick<BlogSummaryDTO, 'id' | 'title' | 'slug' | 'imageUrl' | 'publishedAt' | 'readingTime'>
  >;
}
