/**
 * Data Access Layer (DAL) - Central Export
 *
 * This module provides a centralized export for all DAL functions.
 * Import from here for consistent data access with Next.js 16 caching.
 */

// Favorites DAL - user-specific data with 'use cache: private'
export {
  checkIsFavorited,
  getListingReviews,
  type Review,
  type ReviewDocument,
} from './favorites.dal';
// Listings DAL - public data with 'use cache' and cacheLife('max')
export {
  getListingBySlug,
  getPopularListingSlugs,
  getRelatedListings,
} from './listings.dal';
