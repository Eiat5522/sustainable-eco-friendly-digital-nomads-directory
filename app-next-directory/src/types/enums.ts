import { DEFAULT_CATEGORIES } from '@/lib/constants/categories';

/**
 * Shared enums and constants for the sustainable digital nomads directory
 * These should match the validation options in Sanity schemas
 */

// Listing category/type enum
export enum ListingCategory {
  COWORKING = 'coworking',
  CAFE = 'cafe',
  ACCOMMODATION = 'accommodation',
  RESTAURANT = 'restaurant',
  ACTIVITIES = 'activities'
}

// Price range enum
export enum PriceRange {
  BUDGET = 'budget',
  MODERATE = 'moderate',
  PREMIUM = 'premium'
}

// Moderation status enum
export enum ModerationStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  FLAGGED = 'flagged'
}

// Verification status enum
export enum VerificationStatus {
  UNVERIFIED = 'unverified',
  VERIFIED = 'verified',
  NEEDS_VERIFICATION = 'needs_verification'
}

// Type exports for backward compatibility
export type ListingType = ListingCategory;
export type PriceRangeType = PriceRange;
export type ModerationStatusType = ModerationStatus;
export type VerificationStatusType = VerificationStatus;

// Array of all listing categories for validation - uses shared constants for consistency
export const LISTING_CATEGORIES = [...DEFAULT_CATEGORIES];
export const PRICE_RANGES = Object.values(PriceRange);
export const MODERATION_STATUSES = Object.values(ModerationStatus);
export const VERIFICATION_STATUSES = Object.values(VerificationStatus);