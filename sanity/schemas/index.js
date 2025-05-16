// Import all schema types

import listing from './listing'
import city from './city'
import ecoTag from './ecoTag'
import nomadFeature from './nomadFeature'
import coworkingDetails from './coworkingDetails'
import cafeDetails from './cafeDetails'
import accommodationDetails from './accommodationDetails'
import restaurantDetails from './restaurantDetails'
import activitiesDetails from './activitiesDetails'
import review from './review'
import event from './event'
import user from './user'
import blogPost from './blogPost'
import comment from './comment'
import eventRegistration from './eventRegistration'
import listingAnalytics from './listingAnalytics'
import userPreference from './userPreference'
import richText from './richText'

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
  blogPost,
  eventRegistration,
  listingAnalytics,
  userPreference,
  // Objects
  coworkingDetails,
  cafeDetails,
  accommodationDetails,
  restaurantDetails,
  activitiesDetails,
  richText,
  comment
]
