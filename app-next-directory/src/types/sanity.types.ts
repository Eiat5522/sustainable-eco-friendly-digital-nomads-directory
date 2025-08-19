// Bridge re-export so existing imports using '@/types/sanity.types' keep working
export interface SanityImage {
  _type: 'image';
  _key?: string;
  asset: {
    _id: string;
    _ref: string;
    _type: 'reference';
    url?: string;
    metadata?: {
      dimensions?: { width: number; height: number };
      lqip?: string;
    };
  };
  alt?: string;
}

export interface SanityCity {
  _id: string;
  _type: 'city';
  name: string;
  slug: { current: string };
  country: string;
  description?: string;
  sustainabilityScore: number;
  highlights?: string[];
  primaryImage?: SanityImage;
}

export interface SanityEcoTag {
  _id: string;
  _type: 'ecoTag';
  name: string;
  slug: { current: string };
  description?: string;
}

export interface SanityNomadFeature {
  _id: string;
  _type: 'nomadFeature';
  name: string;
  slug: { current: string };
  description?: string;
}

export interface SanityAmenity {
  _id: string;
  _type: 'amenity';
  name: string;
  slug: { current: string };
  icon?: string;
  category?: string;
}

// Nested object types
export interface SanityCoworkingDetails {
  pricingPlans: Array<{
    type: string;
    price: number;
    period: string;
    features?: string[];
  }>;
  openingHours?: Array<{
    day: string;
    opens: string;
    closes: string;
  }>;
  internetSpeed: {
    download: number;
    upload: number;
    lastTested: string; // ISO 8601 date string
  };
}

export interface SanityCafeDetails {
  openingHours?: Array<{
    day: string;
    opens: string;
    closes: string;
  }>;
  priceIndication?: string;
  menuHighlights?: string[];
  workspaceAmenities?: string[];
  maxRecommendedStay?: number;
  noiseLevel?: 'very_quiet' | 'low' | 'moderate' | 'high' | 'very_loud';
  powerOutlets?: {
    availability?: string;
    notes?: string;
  };
  workPolicy?: {
    laptopsAllowed?: boolean;
    timeLimit?: number;
    peakHoursPolicy?: string;
    peakHours?: string;
  };
  veganFriendly?: {
    isVeganFriendly?: boolean;
    veganOptions?: number;
  };
}

export interface SanityRestaurantDetails {
  cuisineType?: string[];
  priceRange?: 'budget' | 'moderate' | 'expensive' | 'luxury';
  operatingHours?: string;
  sustainabilityInitiatives?: string[];
  dietaryOptions?: string[];
  seating?: string[];
  workFriendly?: string[];
  averageMealPriceThb?: { min?: number; max?: number };
}

export interface SanityActivitiesDetails {
  activityType?: string;
  duration?: { value?: number; unit?: string };
  groupSize?: { min?: number; max?: number };
  sustainabilityPractices?: string[];
  skillLevel?: string;
  ecoScore?: {
    score?: number;
    certifications?: string[];
    justification?: string;
  };
  languages?: string[];
  accessibility?: {
    wheelchairAccessible?: boolean;
    mobilityLevel?: string;
    accessibilityNotes?: string;
  };
  seasonality?: {
    bestMonths?: string[];
    weatherDependent?: boolean;
  };
}

export interface SanityAccommodationDetails {
  accommodationType?: string;
  pricePerNightThb?: { min?: number; max?: number };
  openingHours?: Array<{ day: string; opens: string; closes: string }>;
  roomTypesAvailable?: Array<{
    type: string;
    pricePerNight?: number;
    features?: string[];
  }>;
  minimumStay?: number;
  coworkingPartnership?: {
    hasPartnership?: boolean;
    partner?: string;
    discountDetails?: string;
  };
  workspaceQuality?: {
    hasWorkspace?: boolean;
    workspaceType?: string;
    workspaceFeatures?: string[];
  };
  stayDuration?: {
    minimumNights?: number;
    maximumNights?: number;
    longTermAvailable?: boolean;
    longTermDiscount?: string;
  };
}

export interface SanityModeration {
  status: 'draft' | 'pending' | 'published' | 'archived' | 'flagged';
  featured: boolean;
  verificationStatus: 'unverified' | 'verified' | 'needs_verification';
  moderatorNotes?: string;
}

// Main listing document (single document type with type field)
export interface SanityListing {
  _id: string;
  _type: 'listing';
  name: string;
  slug: { current: string };
  shortDescription?: string;
  longDescription?: string;
  city?: SanityCity;
  type: 'coworking' | 'cafe' | 'accommodation' | 'restaurant' | 'activities';
  address?: string;
  location?: {
    lat: number;
    lng: number;
  };
  primaryImage?: SanityImage;
  galleryImages?: SanityImage[];
  ecoFocusTags?: SanityEcoTag[];
  digitalNomadFeatures?: SanityNomadFeature[];
  amenities?: SanityAmenity[];
  priceRange?: 'budget' | 'moderate' | 'premium';
  contactPhone?: string;
  contactEmail?: string;
  website?: string;
  
  // Type-specific details (only one will be populated based on type field)
  coworkingDetails?: SanityCoworkingDetails;
  cafeDetails?: SanityCafeDetails;
  restaurantDetails?: SanityRestaurantDetails;
  activitiesDetails?: SanityActivitiesDetails;
  accommodationDetails?: SanityAccommodationDetails;
  
  moderation?: SanityModeration;
  reviews?: Array<{ _ref: string; _type: 'reference' }>;
}
