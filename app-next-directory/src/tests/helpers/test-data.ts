import type { Role } from '@/models/User'
import type { Listing, EcoTag } from '@/types/listings'
import type { AppReview } from '@/types/appView'

export type TestUserPlan = 'free' | 'premium'

export interface TestUser {
  id: string
  name: string
  email: string
  role: Role
  plan: TestUserPlan
  password: string
  sessionToken: string
  image?: string
}

export interface TestCity {
  id: string
  name: string
  slug: string
  country: string
  description: string
  heroImage: string
  coordinates: {
    lat: number
    lng: number
  }
  sustainabilityScore: number
  highlights: string[]
  listingIds: string[]
}

export interface TestFavorite {
  id: string
  userId: string
  listingId: string
  createdAt: string
}

export type TestEcoTag = EcoTag

export interface TestData {
  users: TestUser[]
  listings: Listing[]
  cities: TestCity[]
  favorites: TestFavorite[]
  reviews: AppReview[]
  ecoTags: TestEcoTag[]
}

export interface TestSession {
  token: string
  user: TestUser
}

export const TEST_SESSION_COOKIE_NAME = 'next-auth.session-token'

function clone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }
  return JSON.parse(JSON.stringify(value))
}

const ecoTags: TestEcoTag[] = [
  {
    _id: 'eco-zero-waste',
    name: 'Zero Waste Champion',
    slug: { current: 'zero-waste' },
    description: 'Businesses that have adopted strong waste reduction and circular economy practices.'
  },
  {
    _id: 'eco-solar-powered',
    name: 'Solar Powered',
    slug: { current: 'solar-powered' },
    description: 'Powered primarily by on-site solar or other renewable energy sources.'
  },
  {
    _id: 'eco-plant-based',
    name: 'Plant Forward Menu',
    slug: { current: 'plant-forward' },
    description: 'Offers abundant plant-based meals and low-impact dining options.'
  },
  {
    _id: 'eco-water-wise',
    name: 'Water Wise',
    slug: { current: 'water-wise' },
    description: 'Invests in water conservation through greywater systems, filtration and guest education.'
  },
  {
    _id: 'eco-community',
    name: 'Community Builder',
    slug: { current: 'community-builder' },
    description: 'Partners with local organisations and artisans to give back to the neighbourhood.'
  }
]

const pickTags = (...slugs: string[]): EcoTag[] =>
  slugs.map((slug) => {
    const tag = ecoTags.find((candidate) => candidate.slug.current === slug)
    if (!tag) {
      throw new Error(`Unknown eco tag requested: ${slug}`)
    }
    return {
      ...tag,
      slug: { ...tag.slug }
    }
  })

const listings: Listing[] = [
  {
    _id: 'listing-bangkok-eco-hub',
    slug: { current: 'bangkok-eco-hub' },
    name: 'Bangkok Eco Hub',
    city: {
      name: 'Bangkok',
      slug: { current: 'bangkok' }
    },
    type: 'coworking',
    category: 'coworking',
    address: '123 Green Road, Bangkok',
    shortDescription: 'Solar powered coworking with upcycled interiors and filtered air.',
    longDescription:
      'Bangkok Eco Hub is a light-filled coworking space that runs on 100% renewable energy. It offers ergonomic workstations, phone booths, a makers corner and a plant filled rooftop terrace for breaks between deep work sessions.',
    ecoFocusTags: pickTags('solar-powered', 'zero-waste', 'community-builder'),
    primaryImage: {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: 'image-bangkok-eco-hub-800x600-jpg'
      }
    },
    galleryImages: [
      {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: 'image-bangkok-eco-hub-rooftop-1600x900-jpg'
        }
      }
    ],
    priceRange: '$$',
    website: 'https://bangkok-eco-hub.test',
    digitalNomadFeatures: ['fiber-wifi', 'quiet-zones', 'phone-booths', 'standing-desks'],
    lastVerifiedDate: '2024-05-20',
    moderationStatus: 'published',
    verificationStatus: 'verified',
    ecoRating: 92,
    coordinates: {
      latitude: 13.7563,
      longitude: 100.5018
    },
    location: {
      lat: 13.7563,
      lng: 100.5018
    },
    coworkingDetails: {
      operatingHours: '24/7 access for members',
      pricingPlans: [
        { name: 'Day Pass', price: 20, duration: 'day', features: ['Hot desk', 'Coffee & tea'] },
        { name: 'Resident', price: 180, duration: 'month', features: ['Dedicated desk', 'Locker', '5 meeting credits'] }
      ],
      specificAmenitiesCoworking: ['Podcast studio', 'Makers corner', 'Wellness room']
    }
  },
  {
    _id: 'listing-chiang-mai-green-cafe',
    slug: { current: 'chiang-mai-green-cafe' },
    name: 'Chiang Mai Green Cafe',
    city: {
      name: 'Chiang Mai',
      slug: { current: 'chiang-mai' }
    },
    type: 'cafe',
    category: 'cafe',
    address: '48 Nimmanahaeminda Road, Chiang Mai',
    shortDescription: 'Organic cafe with refill station and fair-trade roastery.',
    longDescription:
      'Chiang Mai Green Cafe roasts organic beans sourced directly from northern Thai cooperatives. They compost coffee grounds, operate a bring-your-own-container discount scheme and host weekly zero-waste workshops for locals and travellers.',
    ecoFocusTags: pickTags('community-builder', 'zero-waste', 'plant-forward'),
    primaryImage: {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: 'image-chiang-mai-green-cafe-800x600-jpg'
      }
    },
    galleryImages: [],
    priceRange: '$',
    website: 'https://chiangmai-green-cafe.test',
    digitalNomadFeatures: ['reliable-wifi', 'outdoor-garden', 'power-outlets'],
    lastVerifiedDate: '2024-05-02',
    moderationStatus: 'published',
    verificationStatus: 'verified',
    ecoRating: 88,
    coordinates: {
      latitude: 18.7895,
      longitude: 98.9852
    },
    location: {
      lat: 18.7895,
      lng: 98.9852
    },
    cafeDetails: {
      operatingHours: 'Mon-Sun 08:00-19:00',
      priceIndication: '฿฿',
      menuHighlightsCafe: ['Seasonal tasting flights', 'Plant-based brunch', 'Fermented tonics'],
      wifiReliabilityNotes: '200 Mbps fibre and numerous charging stations.'
    }
  },
  {
    _id: 'listing-lisbon-earth-stay',
    slug: { current: 'lisbon-earth-stay' },
    name: 'Lisbon Earth Stay',
    city: {
      name: 'Lisbon',
      slug: { current: 'lisbon' }
    },
    type: 'accommodation',
    category: 'accommodation',
    address: 'Rua Verde 10, Lisbon',
    shortDescription: 'Boutique coliving with rainwater harvesting and rooftop gardens.',
    longDescription:
      'Lisbon Earth Stay is a B-Corp certified coliving house for location independent professionals. Suites feature reclaimed timber, natural cooling and refill bars. Residents can join weekly climate tech meetups on the edible rooftop garden overlooking Alfama.',
    ecoFocusTags: pickTags('water-wise', 'solar-powered', 'community-builder'),
    primaryImage: {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: 'image-lisbon-earth-stay-800x600-jpg'
      }
    },
    galleryImages: [],
    priceRange: '$$$',
    website: 'https://lisbon-earth-stay.test',
    digitalNomadFeatures: ['private-studios', 'community-events', 'meeting-rooms', 'airport-transfer'],
    lastVerifiedDate: '2024-04-18',
    moderationStatus: 'published',
    verificationStatus: 'verified',
    ecoRating: 95,
    coordinates: {
      latitude: 38.7223,
      longitude: -9.1393
    },
    location: {
      lat: 38.7223,
      lng: -9.1393
    },
    accommodationDetails: {
      accommodationType: 'Coliving suites',
      pricePerNightThbRange: {
        min: 4500,
        max: 7200
      },
      roomTypesAvailable: ['Studio suite', 'Two bedroom apartment', 'Community pods'],
      specificAmenitiesAccommodation: ['Greywater irrigation', 'Community kitchen', 'Rooftop solar lounge']
    }
  }
]

const cities: TestCity[] = [
  {
    id: 'city-bangkok',
    name: 'Bangkok',
    slug: 'bangkok',
    country: 'Thailand',
    description: 'Vibrant Thai capital embracing green transit, creative reuse and solar innovation.',
    heroImage: 'https://images.test/bangkok.jpg',
    coordinates: { lat: 13.7563, lng: 100.5018 },
    sustainabilityScore: 78,
    highlights: ['Extensive BTS/MRT network', 'Innovative circular startups', 'Community-led river cleanups'],
    listingIds: ['listing-bangkok-eco-hub']
  },
  {
    id: 'city-chiang-mai',
    name: 'Chiang Mai',
    slug: 'chiang-mai',
    country: 'Thailand',
    description: 'Mountain city with slow travel vibes, organic food networks and creative makerspaces.',
    heroImage: 'https://images.test/chiang-mai.jpg',
    coordinates: { lat: 18.7883, lng: 98.9853 },
    sustainabilityScore: 84,
    highlights: ['Zero-waste cafes & refill culture', 'Community composting hubs', 'Cycling friendly old town'],
    listingIds: ['listing-chiang-mai-green-cafe']
  },
  {
    id: 'city-lisbon',
    name: 'Lisbon',
    slug: 'lisbon',
    country: 'Portugal',
    description: 'Atlantic tech hub championing renewables, slow food and ocean restoration.',
    heroImage: 'https://images.test/lisbon.jpg',
    coordinates: { lat: 38.7223, lng: -9.1393 },
    sustainabilityScore: 90,
    highlights: ['100% renewable electricity target', 'Ocean-positive innovation labs', 'Car-free neighbourhood pilots'],
    listingIds: ['listing-lisbon-earth-stay']
  }
]

const users: TestUser[] = [
  {
    id: 'user-riley-regular',
    name: 'Riley Regular',
    email: 'user@example.com',
    role: 'user',
    plan: 'free',
    password: 'password123',
    sessionToken: 'session-token-regular',
    image: 'https://images.test/users/riley.png'
  },
  {
    id: 'user-erin-editor',
    name: 'Erin Editor',
    email: 'editor@example.com',
    role: 'editor',
    plan: 'free',
    password: 'password123',
    sessionToken: 'session-token-editor',
    image: 'https://images.test/users/erin.png'
  },
  {
    id: 'user-vera-venue',
    name: 'Vera VenueOwner',
    email: 'venue@example.com',
    role: 'venueOwner',
    plan: 'premium',
    password: 'password123',
    sessionToken: 'session-token-venue-owner',
    image: 'https://images.test/users/vera.png'
  },
  {
    id: 'user-ada-admin',
    name: 'Ada Admin',
    email: 'admin@example.com',
    role: 'admin',
    plan: 'premium',
    password: 'password123',
    sessionToken: 'session-token-admin',
    image: 'https://images.test/users/ada.png'
  }
]

const favorites: TestFavorite[] = [
  {
    id: 'fav-riley-bangkok',
    userId: 'user-riley-regular',
    listingId: 'listing-bangkok-eco-hub',
    createdAt: '2024-06-10T10:15:00.000Z'
  },
  {
    id: 'fav-riley-chiang-mai',
    userId: 'user-riley-regular',
    listingId: 'listing-chiang-mai-green-cafe',
    createdAt: '2024-06-11T08:22:00.000Z'
  },
  {
    id: 'fav-vera-lisbon',
    userId: 'user-vera-venue',
    listingId: 'listing-lisbon-earth-stay',
    createdAt: '2024-06-09T18:45:00.000Z'
  }
]

const reviews: AppReview[] = [
  {
    id: 'review-bangkok-1',
    listingId: 'listing-bangkok-eco-hub',
    userId: 'user-riley-regular',
    rating: 5,
    comment: 'Loved the rooftop garden and the events calendar – perfect for meeting other nomads focused on climate.',
    createdAt: '2024-06-01T09:00:00.000Z',
    user: {
      name: 'Riley Regular',
      image: 'https://images.test/users/riley.png'
    }
  },
  {
    id: 'review-bangkok-2',
    listingId: 'listing-bangkok-eco-hub',
    userId: 'user-vera-venue',
    rating: 4,
    comment: 'Great equipment and super friendly staff. The circular design tours were inspirational!',
    createdAt: '2024-06-03T14:32:00.000Z',
    user: {
      name: 'Vera VenueOwner',
      image: 'https://images.test/users/vera.png'
    }
  },
  {
    id: 'review-lisbon-1',
    listingId: 'listing-lisbon-earth-stay',
    userId: 'user-erin-editor',
    rating: 5,
    comment: 'The solar powered coliving suites and rooftop harvest dinners made this a dream remote work stay.',
    createdAt: '2024-05-22T17:12:00.000Z',
    user: {
      name: 'Erin Editor',
      image: 'https://images.test/users/erin.png'
    }
  }
]

const baseData: TestData = {
  users,
  listings,
  cities,
  favorites,
  reviews,
  ecoTags
}

export const mockListings: Listing[] = clone(listings)

export function createTestData(overrides?: Partial<TestData>): TestData {
  const data = clone(baseData) as TestData
  if (overrides?.users) data.users = clone(overrides.users)
  if (overrides?.listings) data.listings = clone(overrides.listings)
  if (overrides?.cities) data.cities = clone(overrides.cities)
  if (overrides?.favorites) data.favorites = clone(overrides.favorites)
  if (overrides?.reviews) data.reviews = clone(overrides.reviews)
  if (overrides?.ecoTags) data.ecoTags = clone(overrides.ecoTags)
  return data
}

export function getTestUser(role: Role): TestUser | undefined {
  const user = users.find((candidate) => candidate.role === role)
  return user ? clone(user) : undefined
}

export function getSessionForRole(role: Role): TestSession | undefined {
  const user = getTestUser(role)
  if (!user) return undefined
  return {
    token: user.sessionToken,
    user
  }
}

export function getFavoritesForUser(userId: string): TestFavorite[] {
  return favorites.filter((favorite) => favorite.userId === userId).map((favorite) => clone(favorite))
}

export function getReviewsForListing(listingId: string): AppReview[] {
  return reviews.filter((review) => review.listingId === listingId).map((review) => clone(review))
}

export function getListingBySlug(slug: string): Listing | undefined {
  const listing = listings.find((candidate) => candidate.slug?.current === slug)
  return listing ? clone(listing) : undefined
}

export function listCities(): TestCity[] {
  return cities.map((city) => clone(city))
}

export function listEcoTags(): TestEcoTag[] {
  return ecoTags.map((tag) => clone(tag))
}
