/**
 * Plausible Analytics Hook
 *
 * @version 1.0.0
 * @date May 18, 2025
 */

import { ANALYTICS_EVENTS, type ListingEvent, type MapEvent, type SearchEvent } from './config'

export function usePlausibleAnalytics() {
  const noop = (...args: any[]) => {
    // No-op function for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', ...args)
    }
  }

  return {
    trackListingEvent: (event: ListingEvent) => noop('listing', event),
    trackSearchEvent: (event: SearchEvent) => noop('search', event),
    trackMapEvent: (event: MapEvent) => noop('map', event),
    trackReviewSubmission: (listingId: string) => noop('review', { listingId }),
    trackFilterApplication: (filters: Record<string, any>) => noop('filter', filters)
  }
}
