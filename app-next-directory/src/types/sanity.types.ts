// Re-export all Sanity types from the generated types file
export * from '../../sanity.types';

// For compatibility, re-export specific types that are commonly used
export type { 
  Listing,
  City,
  EcoTag,
  Review,
  User,
  Amenity,
  LISTING_BY_SLUG_QUERYResult,
  NomadFeature
} from '../../sanity.types';