// Types for GROQ query results
export interface ListingStats {
  totalListings: number
  byCategory: Array<{
    category: string
    count: number
  }>
  topCities: Array<{
    city: string
    country: string
    count: number
  }>
  averageRatings: Array<{
    listing: string
    avgRating: number
  }>
}

export interface WorkspaceResult {
  _id: string
  name: string
  type: 'cafe' | 'coworking'
  wifiSpeed: number
  hasWorkspaces: boolean
  powerOutlets: string
  location: {
    city: string
    coordinates: {
      lat: number
      lng: number
    }
  }
}

export interface SearchResult {
  _id: string
  name: string
  score: number
  type: string
  description: string
  city: string
  mainImage?: {
    asset: {
      url: string
    }
  }
}

export interface NearbyVenue {
  _id: string
  name: string
  distance: number
  location: {
    coordinates: {
      lat: number
      lng: number
    }
  }
  type: string
  city: string
}

export interface VenueSummary {
  coworkingSpaces: {
    total: number
    withHighSpeedWifi: number
    with24Access: number
    priceDistribution: Array<{
      range: 'budget' | 'moderate' | 'premium'
      count: number
    }>
  }
  cafes: {
    total: number
    laptopFriendly: number
    withGoodWifi: number
    withoutTimeLimits: number
  }
}
