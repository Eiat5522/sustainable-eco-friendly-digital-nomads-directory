import type { SanityImage } from './appView';

export interface CitiesApiResponse {
  cities: CityDto[];
  success: boolean;
  metadata: {
    total: number;
    query_time: string;
    performance: {
      totalTimeMs: string;
      queryTimeMs: string;
    };
  };
}

export interface CityDto {
  _id: string;
  name: string;
  slug: string;
  country: string;
  sustainabilityScore: number;
  highlights: string[];
  image: SanityImage;
}

export interface FeaturedListingsApiResponse {
  listings: FeaturedListingDto[];
  success: boolean;
  metadata: {
    total: number;
    queryTime: string;
    performance: {
      totalTimeMs: string;
      queryTimeMs: string;
    };
  };
}

export interface FeaturedListingDto {
  _id: string;
  name: string;
  slug: string;
  city?: {
    _id?: string;
    name?: string;
    slug?: string;
    country?: string;
  };
  ecoFocusTags?: string[];
  digitalNomadFeatures?: string[];
  amenities?: Array<{
    _id: string;
    name: string;
    description?: string;
    badge?: SanityImage;
  }>;
  contactPhone?: string;
  contactEmail?: string;
  website?: string;
  priceRange?: string;
  type?: string;
  shortDescription?: string;
  address?: string;
  category?: string;
  location?: { lat: number; lng: number };
  primaryImage?: SanityImage;
  galleryImages?: SanityImage[];
  imageUrl?: string | null;
  coworkingDetails?: {
    capacity?: number;
    pricingPlans?: Array<{ type: string; price: number; period: string }>;
    openingHours?: Array<{ day: string; opens: string; closes: string }>;
  };
  accommodationDetails?: {
    pricePerNightThb?: { min?: number; max?: number };
    openingHours?: Array<{ day: string; opens: string; closes: string }>;
  };
  cafeDetails?: {
    openingHours?: Array<{ day: string; opens: string; closes: string }>;
  };
}
