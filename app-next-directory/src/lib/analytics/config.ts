// Dynamic imports to avoid missing package errors at compile time
// These packages are mocked in tests and would need to be installed for production use
type AnalyticsInstance = {
  page: (options?: unknown) => Promise<void>;
  track: (name: string, properties?: unknown) => Promise<void>;
  identify: (userId: string, traits?: unknown) => Promise<void>;
};
type AnalyticsFactory =
  | ((options: { app: string; plugins?: unknown[] }) => AnalyticsInstance)
  | null;
type GoogleAnalyticsPlugin = (options: {
  measurementIds: string[];
  config?: { debug?: boolean };
}) => unknown;

let Analytics: AnalyticsFactory = null;
let googleAnalytics: GoogleAnalyticsPlugin | null = null;

try {
  // Try to load analytics packages if available (mocked in tests)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const analyticsModule = require('analytics');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const googleAnalyticsModule = require('@analytics/google-analytics');

  // Handle both default exports and direct exports
  Analytics = analyticsModule.default || analyticsModule;
  googleAnalytics = googleAnalyticsModule.default || googleAnalyticsModule;
} catch {
  // Packages not installed, will use fallback
  Analytics = null;
  googleAnalytics = null;
}

import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
import posthog from 'posthog-js';
import { structuredLogger } from '@/lib/logger';

// Load environment variables
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const VERCEL_ANALYTICS_ID = process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID;
const POSTHOG_TOKEN = process.env.NEXT_PUBLIC_POSTHOG_TOKEN;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

// Initialize PostHog for A/B testing
if (typeof window !== 'undefined' && POSTHOG_TOKEN) {
  posthog.init(POSTHOG_TOKEN, {
    api_host: POSTHOG_HOST,
    loaded: posthog => {
      if (process.env.NODE_ENV === 'development') posthog.debug();
    },
  });
}

// Initialize analytics instance with GA4, Vercel, and PostHog
const analytics =
  Analytics && googleAnalytics
    ? Analytics({
        app: 'sustainable-eco-nomads',
        plugins: [
          googleAnalytics({
            measurementIds: [GA_MEASUREMENT_ID || ''],
            config: {
              debug: process.env.NODE_ENV === 'development',
            },
          }),
        ],
      })
    : {
        // Fallback when packages are not installed
        page: async (_options?: unknown) => {
          /* noop */
        },
        track: async (_name: string, _properties?: unknown) => {
          /* noop */
        },
        identify: async (_userId: string, _traits?: unknown) => {
          /* noop */
        },
      };

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
  properties?: Record<string, unknown>;
}

// Analytics wrapper functions
export const trackPageView = async ({ title, path, referrer, search }: PageViewEvent) => {
  try {
    // Track in GA4
    await analytics.page({
      title,
      path,
      referrer,
      search,
    });

    // VercelAnalytics does not support .track; use only as a component in your layout.
  } catch (error) {
    structuredLogger.error('trackPageView failed', error, { component: 'analytics' });
  }
};

export const trackEvent = async ({ name, properties }: CustomEvent) => {
  try {
    // Track in GA4
    await analytics.track(name, properties);

    // VercelAnalytics does not support .track; use only as a component in your layout.
  } catch (error) {
    structuredLogger.error('trackEvent failed', error, { component: 'analytics', event: name });
  }
};

export const identifyUser = async (userId: string, traits?: Record<string, unknown>) => {
  try {
    // Identify in GA4
    await analytics.identify(userId, traits);

    // VercelAnalytics does not support .identify; use only as a component in your layout.
  } catch (error) {
    structuredLogger.error('identifyUser failed', error, {
      component: 'analytics',
      userId,
    });
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
  API_LATENCY: 'api_latency',
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
    filters?: Record<string, unknown>;
  };
  // Add more event property types as needed
};
