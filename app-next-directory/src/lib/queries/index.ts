// Stubs for GROQ query functions to resolve TypeError in tests
import type {
  ListingStats,
  WorkspaceResult,
  SearchResult,
  NearbyVenue,
  VenueSummary
} from '@/types/query-types'

export async function getDigitalNomadVenueSummary(): Promise<VenueSummary> {
  return {
    coworkingSpaces: {
      total: 10,
      withHighSpeedWifi: 8,
      with24Access: 5,
      priceDistribution: [
        { range: 'budget', count: 3 },
        { range: 'moderate', count: 5 },
        { range: 'premium', count: 2 }
      ]
    },
    cafes: {
      total: 15,
      laptopFriendly: 10,
      withGoodWifi: 12,
      withoutTimeLimits: 7
    }
  }
}

export async function getDigitalNomadWorkspaces(minWifiSpeed: number): Promise<WorkspaceResult[]> {
  return [
    {
      _id: '1',
      name: 'Coworking A',
      type: 'coworking',
      wifiSpeed: Math.max(100, minWifiSpeed),
      hasWorkspaces: true,
      powerOutlets: 'plenty',
      location: {
        city: 'Bangkok',
        coordinates: { lat: 13.7563, lng: 100.5018 }
      }
    }
  ]
}

export async function getListingStats(): Promise<ListingStats> {
  return {
    totalListings: 25,
    byCategory: [
      { category: 'coworking', count: 10 },
      { category: 'cafe', count: 15 }
    ],
    topCities: [
      { city: 'Bangkok', country: 'Thailand', count: 10 },
      { city: 'Chiang Mai', country: 'Thailand', count: 8 },
      { city: 'Phuket', country: 'Thailand', count: 7 },
      { city: 'Ubud', country: 'Indonesia', count: 5 },
      { city: 'Canggu', country: 'Indonesia', count: 4 }
    ],
    averageRatings: [
      { listing: 'Coworking A', avgRating: 4.5 }
    ]
  }
}

export async function getNearbyListings(
  coords: { lat: number; lng: number },
  maxDistanceKm: number
): Promise<NearbyVenue[]> {
  return [
    {
      _id: '1',
      name: 'Venue A',
      distance: 500,
      location: { coordinates: { lat: coords.lat, lng: coords.lng } },
      type: 'coworking',
      city: 'Bangkok'
    }
  ]
}

export async function searchListings(query: string): Promise<SearchResult[]> {
  return [
    {
      _id: '1',
      name: 'Coworking A',
      score: 10,
      type: 'coworking',
      description: 'A great coworking space',
      city: 'Bangkok',
      mainImage: { asset: { url: 'https://example.com/image.jpg' } }
    }
  ]
}