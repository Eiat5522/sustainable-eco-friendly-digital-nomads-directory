/**
 * Data Access Layer (DAL) - Central Export
 *
 * This module provides a centralized export for all DAL functions.
 * Import from here for consistent data access with Next.js 16 caching.
 */

// Auth DAL - user-specific auth data with 'use cache: private'
export {
  type AuthStatus,
  type AuthUser,
  getAuthStatus,
  getCurrentUserId,
  getUserDisplayInfo,
  isUserAdmin,
  type UserDisplayInfo,
} from './auth.dal';

// Favorites DAL - user-specific data with 'use cache: private'
export {
  checkIsFavorited,
  getListingReviews,
  type Review,
  type ReviewDocument,
} from './favorites.dal';

// Home DAL - public home page data with 'use cache'
export {
  getCities,
  getEcoTags,
  getFeaturedListings,
  getHomePageData,
} from './home.dal';

// Listings DAL - public data with 'use cache' and cacheLife('max')
export {
  getListingBySlug,
  getPopularListingSlugs,
  getRelatedListings,
} from './listings.dal';

// Search DAL - search with 'use cache' and cacheLife('minutes')
export {
  buildSearchHref,
  buildSearchParams,
  buildWhereClause,
  DEFAULT_PAGE_SIZES,
  executeSearch,
  getPageNumbers,
  getSearchFacets,
  getSearchPageData,
  MAX_PARAM_VALUE_LENGTH,
  type SearchFacets,
  type SearchFetchError,
  type SearchFetchResult,
  type SearchFetchSuccess,
  type SearchPagination,
} from './search.dal';
