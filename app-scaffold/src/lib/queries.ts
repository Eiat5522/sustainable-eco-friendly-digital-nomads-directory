import { groq } from 'next-sanity'
import { getClient } from '@/lib/sanity.utils'
import type { ListingFilters } from '@/components/ListingFilters'
import type {
  ListingStats,
  WorkspaceResult,
  SearchResult,
  NearbyVenue,
  VenueSummary
} from '@/types/query-types'

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

// Complex aggregation query - Get listing statistics
export async function getListingStats(): Promise<ListingStats> {
  const query = groq`{
    "totalListings": count(*[_type == "listing"]),
    "byCategory": *[_type == "listing"] {
      type
    } | group(type) {
      "category": key,
      "count": count()
    },
    "topCities": *[_type == "listing"] {
      "cityName": city->name,
      "country": city->country
    } | group(cityName, country) {
      "city": cityName,
      "country": country,
      "count": count()
    } | order(count desc)[0...5],
    "averageRatings": *[_type == "review"] {
      "listingId": listing->_id,
      "listingName": listing->name,
      rating
    } | group(listingId, listingName) {
      "listing": listingName,
      "avgRating": avg(rating)
    } | order(avgRating desc)
  }`
  
  return await getClient().fetch<ListingStats>(query)
}

// Advanced digital nomad friendly workspace query with conditional logic
export async function getDigitalNomadWorkspaces(minWifiSpeed = 20): Promise<WorkspaceResult[]> {
  const query = groq`*[_type == "listing" && type in ["cafe", "coworking"]] {
    _id,
    name,
    type,
    "wifiSpeed": select(
      type == "cafe" => cafeDetails.wifiSpeed,
      type == "coworking" => coworkingDetails.internetSpeed.download
    ),
    "hasWorkspaces": coworkingDetails.amenities != null || 
                    (type == "cafe" && defined(cafeDetails.workPolicy.laptopsAllowed)),
    "powerOutlets": select(
      type == "cafe" => cafeDetails.powerOutlets,
      type == "coworking" => "abundant"
    ),
    "location": {
      "city": city->name,
      "coordinates": location.coordinates
    }
  }[wifiSpeed >= $minWifiSpeed && hasWorkspaces]`
  
  return await getClient().fetch<WorkspaceResult[]>(query, { minWifiSpeed })
}

// Full-text search with relevance scoring and rich text content
export async function searchListings(searchText: string): Promise<SearchResult[]> {
  const query = groq`*[_type == "listing" && (
    name match $searchText ||
    description match $searchText ||
    richTextContent.content[].children[].text match $searchText
  )] {
    _id,
    name,
    "score": boost(name match $searchText, 3) +
            boost(description match $searchText, 2) +
            boost(richTextContent.content[].children[].text match $searchText, 1),
    type,
    "description": description,
    "city": city->name,
    mainImage {
      asset-> {
        url
      }
    }
  } | order(score desc)`
  
  return await getClient().fetch<SearchResult[]>(query, { searchText })
}

// Geospatial query for nearby listings
export async function getNearbyListings(coords: { lat: number; lng: number }, maxDistanceKm = 5): Promise<NearbyVenue[]> {
  const query = groq`*[_type == "listing" && defined(location.coordinates)] {
    _id,
    name,
    "distance": geo::distance(location.coordinates, $userLocation),
    location,
    type,
    "city": city->name
  }[distance < $maxDistanceKm] | order(distance)`
  
  return await getClient().fetch<NearbyVenue[]>(query, {
    userLocation: coords,
    maxDistanceKm
  })
}

// Complex venue summary with conditional aggregation
export async function getDigitalNomadVenueSummary(): Promise<VenueSummary> {
  const query = groq`{
    "coworkingSpaces": *[_type == "listing" && type == "coworking"] {
      "hasHighSpeedWifi": coworkingDetails.internetSpeed.download >= 50,
      "has24Access": coworkingDetails.accessPolicy.hours == "24/7",
      "priceRange": select(
        count(coworkingDetails.pricingPlans[price < 20]) > 0 => "budget",
        count(coworkingDetails.pricingPlans[price >= 20 && price < 50]) > 0 => "moderate",
        "premium"
      )
    } | {
      "total": count(*),
      "withHighSpeedWifi": count(*[hasHighSpeedWifi]),
      "with24Access": count(*[has24Access]),
      "priceDistribution": group(priceRange) {
        "range": key,
        "count": count()
      }
    },
    
    "cafes": *[_type == "listing" && type == "cafe"] {
      "isLaptopFriendly": cafeDetails.workPolicy.laptopsAllowed,
      "hasGoodWifi": cafeDetails.wifiSpeed >= 20,
      "noTimeLimits": !defined(cafeDetails.workPolicy.timeLimit) || cafeDetails.workPolicy.timeLimit == 0
    } | {
      "total": count(*),
      "laptopFriendly": count(*[isLaptopFriendly]),
      "withGoodWifi": count(*[hasGoodWifi]),
      "withoutTimeLimits": count(*[noTimeLimits])
    }
  }`
  
  return await getClient().fetch<VenueSummary>(query)
}
