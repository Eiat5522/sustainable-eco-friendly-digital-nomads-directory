// @ts-ignore
import Analytics from 'analytics';
// @ts-ignore
import googleAnalytics from '@analytics/google-analytics';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
import posthog from 'posthog-js';

// Load environment variables
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const VERCEL_ANALYTICS_ID = process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID;
const POSTHOG_TOKEN = process.env.NEXT_PUBLIC_POSTHOG_TOKEN;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

// Initialize PostHog for A/B testing
if (typeof window !== 'undefined' && POSTHOG_TOKEN) {
  posthog.init(POSTHOG_TOKEN, {
    api_host: POSTHOG_HOST,
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug();
    },
  });
}

// Initialize analytics instance with GA4, Vercel, and PostHog
const analytics = Analytics({
  app: 'sustainable-eco-nomads',
  plugins: [
    googleAnalytics({
      measurementIds: [GA_MEASUREMENT_ID || ''],
      config: {
        debug: process.env.NODE_ENV === 'development'
      }
    })
  ]
});

// Initialize Vercel Analytics
// VercelAnalytics is a React component, not an analytics instance with .track/.identify methods.
// Remove .track/.identify calls and only use VercelAnalytics as a component in your app's layout.
export const vercelAnalytics = VercelAnalytics;

// Export analytics instances
export { analytics, posthog };

// Export config constants
export const ANALYTICS_CONFIG = {
  GA_MEASUREMENT_ID,
  VERCEL_ANALYTICS_ID,
  POSTHOG_TOKEN,
  POSTHOG_HOST,
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
} as const;

// Define tracking event types
export interface PageViewEvent {
  title: string;
  path: string;
  referrer?: string;
  search?: string;
}

export interface CustomEvent {
  name: string;
  properties?: Record<string, any>;
}

// Analytics wrapper functions
export const trackPageView = async ({ title, path, referrer, search }: PageViewEvent) => {
  try {
    // Track in GA4
    await analytics.page({
      title,
      path,
      referrer,
      search
    });

    // VercelAnalytics does not support .track; use only as a component in your layout.
  } catch (error) {
    console.error('Error tracking pageview:', error);
  }
};

export const trackEvent = async ({ name, properties }: CustomEvent) => {
  try {
    // Track in GA4
    await analytics.track(name, properties);

    // VercelAnalytics does not support .track; use only as a component in your layout.
  } catch (error) {
    console.error('Error tracking event:', error);
  }
};

export const identifyUser = async (userId: string, traits?: Record<string, any>) => {
  try {
    // Identify in GA4
    await analytics.identify(userId, traits);

    // VercelAnalytics does not support .identify; use only as a component in your layout.
  } catch (error) {
    console.error('Error identifying user:', error);
  }
};

// Pre-defined event names for consistency
export const EventNames = {
  // Listing related events
  LISTING_VIEW: 'listing_view',
  LISTING_CONTACT: 'listing_contact',
  LISTING_BOOKMARK: 'listing_bookmark',
  LISTING_SHARE: 'listing_share',
  LISTING_REVIEW: 'listing_review',

  // Search related events
  SEARCH_QUERY: 'search_query',
  SEARCH_FILTER: 'search_filter',
  SEARCH_RESULTS_VIEW: 'search_results_view',

  // User related events
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
  USER_PROFILE_UPDATE: 'user_profile_update',

  // Map related events
  MAP_VIEW: 'map_view',
  MAP_MARKER_CLICK: 'map_marker_click',
  MAP_SEARCH: 'map_search',

  // Eco-friendly related events
  ECO_TAG_CLICK: 'eco_tag_click',
  SUSTAINABILITY_SCORE_VIEW: 'sustainability_score_view',

  // Navigation events
  NAVIGATION_CLICK: 'navigation_click',
  EXTERNAL_LINK_CLICK: 'external_link_click',

  // Performance events
  ERROR_OCCURRED: 'error_occurred',
  API_LATENCY: 'api_latency'
} as const;

// Event property types for type safety
export type EventProperties = {
  [EventNames.LISTING_VIEW]: {
    listingId: string;
    listingName: string;
    category: string;
    city: string;
  };
  [EventNames.SEARCH_QUERY]: {
    query: string;
    resultsCount: number;
    filters?: Record<string, any>;
  };
  // Add more event property types as needed
};
