/**
 * Plausible Analytics Hook
 *
 * @version 1.0.0
 * @date May 18, 2025
 */

import { structuredLogger } from '@/lib/logger';
import type { ListingEvent, MapEvent, SearchEvent } from './config';

export function usePlausibleAnalytics() {
  const noop = (..._args: unknown[]) => {
    // No-op function for development
    if (process.env.NODE_ENV === 'development') {
      structuredLogger.debug('Analytics Event (noop)', {
        component: 'analytics',
        // Cast args to strings to ensure LogValue compatibility
        args: _args.map(a => (typeof a === 'string' ? a : String(a))),
      });
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
