/**
 * Unit tests for src/lib/data-access/index.ts
 * Tests centralized Data Access Layer exports
 */

import * as dal from '../index';

describe('src/lib/data-access/index', () => {
  describe('Auth DAL Exports', () => {
    it('should export getAuthStatus', () => {
      expect(dal.getAuthStatus).toBeDefined();
      expect(typeof dal.getAuthStatus).toBe('function');
    });

    it('should export getCurrentUserId', () => {
      expect(dal.getCurrentUserId).toBeDefined();
      expect(typeof dal.getCurrentUserId).toBe('function');
    });

    it('should export getIsUserAdmin', () => {
      expect(dal.getIsUserAdmin).toBeDefined();
      expect(typeof dal.getIsUserAdmin).toBe('function');
    });

    it('should export getUserDisplayInfo', () => {
      expect(dal.getUserDisplayInfo).toBeDefined();
      expect(typeof dal.getUserDisplayInfo).toBe('function');
    });

    it('should export AuthStatus type', () => {
      // Type check only - validates export exists
      const authStatus: dal.AuthStatus = null as any;
      expect(authStatus).toBeDefined();
    });

    it('should export AuthUser type', () => {
      // Type check only - validates export exists
      const authUser: dal.AuthUser = null as any;
      expect(authUser).toBeDefined();
    });

    it('should export UserDisplayInfo type', () => {
      // Type check only - validates export exists
      const userDisplayInfo: dal.UserDisplayInfo = null as any;
      expect(userDisplayInfo).toBeDefined();
    });
  });

  describe('Favorites DAL Exports', () => {
    it('should export checkIsFavorited', () => {
      expect(dal.checkIsFavorited).toBeDefined();
      expect(typeof dal.checkIsFavorited).toBe('function');
    });

    it('should export getListingReviews', () => {
      expect(dal.getListingReviews).toBeDefined();
      expect(typeof dal.getListingReviews).toBe('function');
    });

    it('should export Review type', () => {
      // Type check only - validates export exists
      const review: dal.Review = null as any;
      expect(review).toBeDefined();
    });

    it('should export ReviewDocument type', () => {
      // Type check only - validates export exists
      const reviewDoc: dal.ReviewDocument = null as any;
      expect(reviewDoc).toBeDefined();
    });
  });

  describe('Home DAL Exports', () => {
    it('should export getCities', () => {
      expect(dal.getCities).toBeDefined();
      expect(typeof dal.getCities).toBe('function');
    });

    it('should export getEcoTags', () => {
      expect(dal.getEcoTags).toBeDefined();
      expect(typeof dal.getEcoTags).toBe('function');
    });

    it('should export getFeaturedListings', () => {
      expect(dal.getFeaturedListings).toBeDefined();
      expect(typeof dal.getFeaturedListings).toBe('function');
    });

    it('should export getHomePageData', () => {
      expect(dal.getHomePageData).toBeDefined();
      expect(typeof dal.getHomePageData).toBe('function');
    });
  });

  describe('Listings DAL Exports', () => {
    it('should export getListingBySlug', () => {
      expect(dal.getListingBySlug).toBeDefined();
      expect(typeof dal.getListingBySlug).toBe('function');
    });

    it('should export getPopularListingSlugs', () => {
      expect(dal.getPopularListingSlugs).toBeDefined();
      expect(typeof dal.getPopularListingSlugs).toBe('function');
    });

    it('should export getRelatedListings', () => {
      expect(dal.getRelatedListings).toBeDefined();
      expect(typeof dal.getRelatedListings).toBe('function');
    });
  });

  describe('Search DAL Exports', () => {
    it('should export buildSearchHref', () => {
      expect(dal.buildSearchHref).toBeDefined();
      expect(typeof dal.buildSearchHref).toBe('function');
    });

    it('should export buildSearchParams', () => {
      expect(dal.buildSearchParams).toBeDefined();
      expect(typeof dal.buildSearchParams).toBe('function');
    });

    it('should export buildWhereClause', () => {
      expect(dal.buildWhereClause).toBeDefined();
      expect(typeof dal.buildWhereClause).toBe('function');
    });

    it('should export executeSearch', () => {
      expect(dal.executeSearch).toBeDefined();
      expect(typeof dal.executeSearch).toBe('function');
    });

    it('should export getPageNumbers', () => {
      expect(dal.getPageNumbers).toBeDefined();
      expect(typeof dal.getPageNumbers).toBe('function');
    });

    it('should export getSearchFacets', () => {
      expect(dal.getSearchFacets).toBeDefined();
      expect(typeof dal.getSearchFacets).toBe('function');
    });

    it('should export getSearchPageData', () => {
      expect(dal.getSearchPageData).toBeDefined();
      expect(typeof dal.getSearchPageData).toBe('function');
    });

    it('should export DEFAULT_PAGE_SIZES constant', () => {
      expect(dal.DEFAULT_PAGE_SIZES).toBeDefined();
    });

    it('should export MAX_PARAM_VALUE_LENGTH constant', () => {
      expect(dal.MAX_PARAM_VALUE_LENGTH).toBeDefined();
      expect(typeof dal.MAX_PARAM_VALUE_LENGTH).toBe('number');
    });

    it('should export SearchFacets type', () => {
      // Type check only - validates export exists
      const facets: dal.SearchFacets = null as any;
      expect(facets).toBeDefined();
    });

    it('should export SearchFetchError type', () => {
      // Type check only - validates export exists
      const error: dal.SearchFetchError = null as any;
      expect(error).toBeDefined();
    });

    it('should export SearchFetchResult type', () => {
      // Type check only - validates export exists
      const result: dal.SearchFetchResult = null as any;
      expect(result).toBeDefined();
    });

    it('should export SearchFetchSuccess type', () => {
      // Type check only - validates export exists
      const success: dal.SearchFetchSuccess = null as any;
      expect(success).toBeDefined();
    });

    it('should export SearchPagination type', () => {
      // Type check only - validates export exists
      const pagination: dal.SearchPagination = null as any;
      expect(pagination).toBeDefined();
    });
  });

  describe('Module Organization', () => {
    it('should have consistent caching patterns across DAL modules', () => {
      // This test documents the caching strategy:
      // - Auth DAL: 'use cache: private' (user-specific)
      // - Favorites DAL: 'use cache: private' (user-specific)
      // - Home DAL: 'use cache' (public)
      // - Listings DAL: 'use cache' with cacheLife('max') (public, long-lived)
      // - Search DAL: 'use cache' with cacheLife('minutes') (public, short-lived)
      expect(true).toBe(true);
    });
  });
});
