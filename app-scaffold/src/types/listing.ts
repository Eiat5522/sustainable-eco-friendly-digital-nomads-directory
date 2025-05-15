// Basic types
export type ListingType = 'coworking' | 'cafe' | 'accommodation' | 'restaurant' | 'activities'
export type PriceRange = 'budget' | 'moderate' | 'premium'

// City type
export interface City {
  _id: string
  name: string
  slug: string
  listingCount: number
  country: string
  coordinates: {
    lat: number
    lng: number
  }
}

// Eco Tag type
export interface EcoTag {
  _id: string
  name: string
  slug: string
  description: string
  listingCount: number
  icon?: string
}

// Base listing interface
export interface Listing {
  _id: string
  name: string
  slug: string
  description: string
  type: ListingType
  priceRange: PriceRange
  mainImage: {
    asset: {
      _ref: string
      url: string
    }
  }
  galleryImages?: Array<{
    asset: {
      _ref: string
      url: string
    }
  }>
  city: City
  ecoTags: EcoTag[]
  location: {
    lat: number
    lng: number
  }
  address: string
  rating: number
  website?: string
  phone?: string
  email?: string
  socialLinks?: {
    facebook?: string
    instagram?: string
    twitter?: string
  }
  hours?: {
    monday?: string
    tuesday?: string
    wednesday?: string
    thursday?: string
    friday?: string
    saturday?: string
    sunday?: string
  }
  amenities?: string[]
  createdAt: string
  updatedAt: string
}

// Specific listing type interfaces
export interface CoworkingListing extends Listing {
  type: 'coworking'
  coworkingDetails: {
    deskTypes: Array<'hot' | 'dedicated' | 'private'>
    meetingRooms: boolean
    internetSpeed: number
    printerScanner: boolean
    parking: boolean
    bikeParking: boolean
    shower: boolean
    airConditioning: boolean
    kitchen: boolean
    lockers: boolean
    eventSpace: boolean
    petFriendly: boolean
    accessibility: boolean
  }
}

export interface CafeListing extends Listing {
  type: 'cafe'
  cafeDetails: {
    wifi: boolean
    powerOutlets: boolean
    workspaceType: Array<'tables' | 'bar' | 'outdoor'>
    noiseLevel: 'quiet' | 'moderate' | 'lively'
    veganOptions: boolean
    glutenFree: boolean
    organicOptions: boolean
  }
}

export interface AccommodationListing extends Listing {
  type: 'accommodation'
  accommodationDetails: {
    roomTypes: Array<'private' | 'shared' | 'dorm'>
    minStay: number
    maxStay?: number
    breakfast: boolean
    kitchen: boolean
    laundry: boolean
    wifi: boolean
    workspace: boolean
    pool: boolean
    airConditioning: boolean
    heating: boolean
  }
}

export interface RestaurantListing extends Listing {
  type: 'restaurant'
  restaurantDetails: {
    cuisine: string[]
    dietaryOptions: Array<'vegan' | 'vegetarian' | 'glutenFree' | 'dairyFree'>
    pricePerPerson: number
    delivery: boolean
    takeaway: boolean
    reservation: boolean
    outdoorSeating: boolean
  }
}

export interface ActivitiesListing extends Listing {
  type: 'activities'
  activitiesDetails: {
    category: Array<'outdoor' | 'wellness' | 'culture' | 'sports'>
    duration: string
    difficulty: 'easy' | 'moderate' | 'challenging'
    groupSize: {
      min: number
      max: number
    }
    seasonality: Array<'spring' | 'summer' | 'autumn' | 'winter'>
    equipment: boolean
  }
}

// Combined type for all listing types
export type AnyListing =
  | CoworkingListing
  | CafeListing
  | AccommodationListing
  | RestaurantListing
  | ActivitiesListing
