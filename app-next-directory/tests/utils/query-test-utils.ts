import { expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'

export interface TestListing {
  name: string
  type: 'coworking' | 'cafe' | 'accommodation' | 'restaurant' | 'activity'
  city: {
    _type: 'reference'
    _ref: string
  }
  description: string
  wifiSpeed?: number
  location: {
    coordinates: {
      lat: number
      lng: number
    }
  }
}

export async function createTestListings(listings: TestListing[]) {
  return listings.map((listing) => ({
    _type: 'listing',
    _id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...listing,
  }))
}

export async function cleanupTestListings(ids: string[]) {
  ids.length
}

export function validateListingResult(listing: any) {
  expect(listing).toHaveProperty('_id')
  expect(listing).toHaveProperty('name')
  expect(listing).toHaveProperty('type')
  
  if (listing.type === 'coworking' || listing.type === 'cafe') {
    expect(listing).toHaveProperty('wifiSpeed')
    if (listing.wifiSpeed) {
      expect(typeof listing.wifiSpeed).toBe('number')
    }
  }
  
  if (listing.location) {
    expect(listing.location).toHaveProperty('coordinates')
    expect(listing.location.coordinates).toHaveProperty('lat')
    expect(listing.location.coordinates).toHaveProperty('lng')
  }
  
  return true
}

export const TEST_CITIES = {
  bangkok: {
    name: 'Bangkok',
    country: 'Thailand',
    coordinates: { lat: 13.7563, lng: 100.5018 }
  },
  chiangMai: {
    name: 'Chiang Mai',
    country: 'Thailand',
    coordinates: { lat: 18.7883, lng: 98.9853 }
  },
  phuket: {
    name: 'Phuket',
    country: 'Thailand',
    coordinates: { lat: 7.8804, lng: 98.3923 }
  }
}

export const SAMPLE_LISTINGS: TestListing[] = [
  {
    name: 'Digital Nomad Hub',
    type: 'coworking',
    city: { _type: 'reference', _ref: 'bangkok' },
    description: 'High-speed workspace in central Bangkok',
    wifiSpeed: 100,
    location: {
      coordinates: { ...TEST_CITIES.bangkok.coordinates }
    }
  },
  {
    name: 'Eco Cafe',
    type: 'cafe',
    city: { _type: 'reference', _ref: 'chiangMai' },
    description: 'Sustainable cafe with great workspaces',
    wifiSpeed: 50,
    location: {
      coordinates: { ...TEST_CITIES.chiangMai.coordinates }
    }
  },
  {
    name: 'Beach Resort',
    type: 'accommodation',
    city: { _type: 'reference', _ref: 'phuket' },
    description: 'Eco-friendly beachfront resort',
    location: {
      coordinates: { ...TEST_CITIES.phuket.coordinates }
    }
  }
]
