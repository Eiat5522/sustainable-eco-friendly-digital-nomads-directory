/**
 * Analytics Configuration
 *
 * @version 1.0.0
 * @date May 18, 2025
 */

// Custom event types for type safety
export type ListingEvent = {
  listingId: string
  action: 'view' | 'contact' | 'bookmark' | 'share'
  category?: string
  city?: string
}

export type SearchEvent = {
  query: string
  filters?: string[]
  resultsCount: number
}

export type MapEvent = {
  action: 'pan' | 'zoom' | 'click'
  region?: string
  markersVisible?: number
}

// Event names for consistency
export const ANALYTICS_EVENTS = {
  LISTING: 'listing_interaction',
  SEARCH: 'search_performed',
  MAP: 'map_interaction',
  REVIEW: 'review_submitted',
  FILTER: 'filter_applied'
} as const
