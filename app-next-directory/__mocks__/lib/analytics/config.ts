// Mock for @/lib/analytics/config
export const trackPageView = jest.fn();
export const trackEvent = jest.fn();
export const identifyUser = jest.fn();

export const analytics = {
  page: jest.fn(),
  track: jest.fn(),
  identify: jest.fn(),
};

export const posthog = {
  init: jest.fn(),
  capture: jest.fn(),
  identify: jest.fn(),
  debug: jest.fn(),
};

export const vercelAnalytics = jest.fn();

export const ANALYTICS_CONFIG = {
  GA_MEASUREMENT_ID: 'mock-ga-id',
  VERCEL_ANALYTICS_ID: 'mock-vercel-id',
  POSTHOG_TOKEN: 'mock-posthog-token',
  POSTHOG_HOST: 'https://mock-posthog.com',
  IS_PRODUCTION: false,
} as const;

export const EventNames = {
  LISTING_VIEW: 'listing_view',
  LISTING_CONTACT: 'listing_contact',
  LISTING_BOOKMARK: 'listing_bookmark',
  LISTING_SHARE: 'listing_share',
  LISTING_REVIEW: 'listing_review',
  SEARCH_QUERY: 'search_query',
  SEARCH_FILTER: 'search_filter',
  SEARCH_RESULTS_VIEW: 'search_results_view',
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
  USER_PROFILE_UPDATE: 'user_profile_update',
  MAP_VIEW: 'map_view',
  MAP_MARKER_CLICK: 'map_marker_click',
  MAP_SEARCH: 'map_search',
  ECO_TAG_CLICK: 'eco_tag_click',
  SUSTAINABILITY_SCORE_VIEW: 'sustainability_score_view',
  NAVIGATION_CLICK: 'navigation_click',
  EXTERNAL_LINK_CLICK: 'external_link_click',
  ERROR_OCCURRED: 'error_occurred',
  API_LATENCY: 'api_latency',
} as const;
