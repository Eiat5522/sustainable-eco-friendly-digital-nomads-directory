/**
 * Re-export generated Sanity types for use in the Next.js app
 * This file imports the auto-generated types from the Sanity directory
 */

// Import all generated types from Sanity TypeGen
export * from '../../../sanity/sanity.types'

// Re-export commonly used types with more convenient names
export type {
  Listing as SanityListing,
  LISTING_BY_SLUG_QUERYResult,
  FEATURED_LISTINGS_QUERYResult,
  CITIES_QUERYResult,
  City as SanityCity,
  EcoTag as SanityEcoTag,
  BlogPost as SanityBlogPost,
  Review as SanityReview,
  User as SanityUser
} from '../../../sanity/sanity.types'