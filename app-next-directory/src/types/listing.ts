// This file is now deprecated. Please use types from sanity/sanity.types.ts or src/types/appView.ts

// Basic types
import type { ListingCategory, PriceRange } from './enums'

export type ListingType = ListingCategory
export type PriceRangeType = PriceRange

// LocalCity type
export interface LocalCity {
  _id: string
  name: string
  slug: string | { current: string }
  listingCount: number
  country: string
}

// Eco Tag type
export interface EcoTag {
  _id: string
  name: string
  slug: { current: string }
  description: string
  listingCount: number
  icon?: string
}


// Base listing interface
export interface Listing {
  location?: {
    lat: number;
    lng: number;
    coordinates: [number, number];
  };
  _id: string
  name: string
  slug: { current: string }
  shortDescription?: string
  longDescription?: string
  type: ListingType
  priceRange?: PriceRange;
  primaryImage?: {
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
  city?: LocalCity
  ecoTags: EcoTag[]
  ecoRating?: number
  address: string
  
  website?: string
  phone?: string
  email?: string
  digitalNomadFeatures?: string[];
  sourceUrls?: string[];
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
  createdAt?: string
  updatedAt?: string
  price?: number
  priceIndication?: string;  // Changed from price_indication to camelCase
  lastVerifiedDate?: string;
  coordinates?: [number, number]
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  verificationStatus?: 'unverified' | 'verified';
}

// Specific listing type interfaces
export interface CoworkingListing extends Listing {
  type: ListingCategory.COWORKING
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
  type: ListingCategory.CAFE
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
  type: ListingCategory.ACCOMMODATION
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
  type: ListingCategory.RESTAURANT
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
  type: ListingCategory.ACTIVITIES
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




