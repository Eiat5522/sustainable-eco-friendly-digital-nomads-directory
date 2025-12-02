/**
 * Plausible Analytics Hook
 *
 * @version 1.0.0
 * @date May 18, 2025
 */

import type { ListingEvent, MapEvent, SearchEvent } from './config';

export function usePlausibleAnalytics() {
  const noop = (..._args: unknown[]) => {
    // No-op function for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', ..._args);
    }
  };

  return {
    trackListingEvent: (event: ListingEvent) => noop('listing', event),
    trackSearchEvent: (event: SearchEvent) => noop('search', event),
    trackMapEvent: (event: MapEvent) => noop('map', event),
    trackReviewSubmission: (listingId: string) => noop('review', { listingId }),
    trackFilterApplication: (filters: Record<string, unknown>) => noop('filter', filters),
  };
}
