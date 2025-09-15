/**
 * Shared constants for the application
 * Centralized definitions to ensure consistency across API and UI
 */

/**
 * Default categories for listings
 * Used as fallback when CMS data is unavailable
 */
export const DEFAULT_CATEGORIES = ['coworking', 'cafe', 'accommodation', 'restaurant', 'activities'] as const;

/**
 * Type representing a valid category
 */
export type Category = typeof DEFAULT_CATEGORIES[number];

/**
 * Set of allowed categories for validation
 */
export const ALLOWED_CATEGORIES = new Set(DEFAULT_CATEGORIES);