import type { PortableTextBlock } from '@portabletext/types';

export type AppCity = { id: string; name: string; slug: string; country?: string; sustainabilityScore?: number; highlights?: string[]; primaryImage?: SanityImage; description?: string; };

export type SanityImage = {
  _type?: 'image';
  _ref?: string;
  alt?: string;
  asset?: {
      _id?: string;
      _ref?: string;
      _type?: 'reference';
      url?: string;
      metadata?: {
        dimensions?: any;
        lqip?: string;
      };
    };
};

export type SanityGalleryImage = SanityImage & {
  _type: 'image';
  _key: string;
};

export type AppListingCard = {
  id: string;
  name: string;
  slug: string;
  city: AppCity | null;
  ecoFocusTags: string[];
  digitalNomadFeatures?: string[];
  priceRange?: 'budget' | 'moderate' | 'premium';
  website?: string | null;
  imageUrl?: string | null;
  primaryImage?: SanityImage;
  galleryImages?: SanityGalleryImage[];
  type?: string;
  shortDescription?: string;
  address?: string;
  category?: string;
  location?: { lat: number; lng: number };
};
import type { Amenity } from '@/types/sanity';

export type AppListingDetail = AppListingCard & {
  contactPhone?: string | null;
  contactEmail?: string | null;
  shortDescription?: string | null;
  longDescription?: string | any[] | null;
  address?: string | null;
  primaryImage?: any;
  galleryImages?: any[];
  lastVerifiedDate?: string | null;
  reviews?: any[];
  coworkingDetails?: {
    pricingPlans?: Array<{ type: string; price: number | null; period: string }>;
    openingHours?: Array<{ day: string; opens: string; closes: string }>;
    internetSpeed?: { download?: number; upload?: number; lastTested?: string };
  } | null;
  accommodationDetails?: {
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
  } | null;
  cafeDetails?: {
    openingHours?: Array<{ day: string; opens: string; closes: string }>;
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
  } | null;
  restaurantDetails?: {
    cuisineType?: string[];
    priceRange?: 'budget' | 'moderate' | 'expensive' | 'luxury';
    operatingHours?: string;
    sustainabilityInitiatives?: string[];
    dietaryOptions?: string[];
    seating?: string[];
    workFriendly?: string[];
    averageMealPriceThb?: { min?: number; max?: number };
  } | null;
  activitiesDetails?: {
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
  } | null;
  amenities?: Amenity[];
  digitalNomadFeatures?: string[];
};

export type AppReview = {
  id: string;
  listingId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    name: string;
    image?: string;
  };
};

export type AppFilterState = {
  location: string | null;
  categories: string[];
  ecoFocusTags: string[];
  digitalNomadFeatures: string[];
  priceRanges: string[];
  searchQuery: string;
  sort?: any;
  combinations?: any[];
  combinationOperator?: any;
};
