import { groq } from 'next-sanity'
import { getClient } from '@/lib/sanity.utils'
import type { ListingFilters } from '@/components/ListingFilters'

// Base listing fields
const listingFields = groq`
  _id,
  name,
  slug,
  description,
  type,
  priceRange,
  "mainImage": mainImage.asset->{url},
  "galleryImages": galleryImages[].asset->{url},
  "city": city->{
    _id,
    name,
    slug,
    country,
    coordinates
  },
  "ecoTags": ecoTags[]->{
    _id,
    name,
    slug,
    description,
    icon
  },
  location,
  address,
  rating,
  website,
  phone,
  email,
  socialLinks,
  hours,
  amenities,
  createdAt,
  updatedAt
`

// Type-specific fields
const typeFields = {
  coworking: groq`coworkingDetails`,
  cafe: groq`cafeDetails`,
  accommodation: groq`accommodationDetails`,
  restaurant: groq`restaurantDetails`,
  activities: groq`activitiesDetails`,
}

export async function getFilteredListings(filters: ListingFilters, page = 1, limit = 12) {
  const { cities, types, ecoTags, priceRange } = filters
  
  let query = groq`*[_type == "listing"`
  const conditions: string[] = []
  const params: Record<string, any> = {}

  if (cities.length > 0) {
    conditions.push('city._ref in $cities')
    params.cities = cities
  }

  if (types.length > 0) {
    conditions.push('type in $types')
    params.types = types
  }

  if (ecoTags.length > 0) {
    conditions.push('count((ecoTags[]->slug.current)[@ in $ecoTags]) > 0')
    params.ecoTags = ecoTags
  }

  if (priceRange.length > 0) {
    conditions.push('priceRange in $priceRange')
    params.priceRange = priceRange
  }

  if (conditions.length > 0) {
    query += ` && ${conditions.join(' && ')}`
  }

  query += `] | order(rating desc) {
    ${listingFields},
    ${Object.entries(typeFields)
      .map(([type, fields]) => `${type} == type => { ${fields} }`)
      .join(',')}
  }[$start...$end]`

  const start = (page - 1) * limit
  const end = start + limit

  const listings = await getClient().fetch(query, {
    ...params,
    start,
    end,
  })

  // Get total count for pagination
  const countQuery = groq`count(*[_type == "listing"${
    conditions.length > 0 ? ` && ${conditions.join(' && ')}` : ''
  }])`
  const total = await getClient().fetch(countQuery, params)

  return {
    listings,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}
