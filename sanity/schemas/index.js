// Import all schema types

import listing from './listing'
import city from './city'
import ecoTag from './ecoTag'
import nomadFeature from './nomadFeature'
import coworkingDetails from './coworkingDetails'
import cafeDetails from './cafeDetails'
import accommodationDetails from './accommodationDetails'
import review from './review'
import event from './event'
import user from './user'
import blogPost from './blogPost'
import comment from './comment'

// Export the schema types
export const schemaTypes = [
  // Documents
  listing,
  city,
  ecoTag,
  nomadFeature,
  review,
  event,
  user,
  // Objects
  coworkingDetails,
  cafeDetails,
  accommodationDetails,
  blogPost,
  comment
]
