export type AppCity = { id: string; name: string; slug: string; country?: string };
export type AppListingCard = {
  id: string;
  name: string;
  slug: string;
  city: AppCity | null;
  ecoTags: string[];
  priceRange?: 'budget'|'moderate'|'premium';
  website?: string | null;
  imageUrl?: string | null;
  primaryImage?: any;
  galleryImages?: any[];
  type?: string;
  shortDescription?: string;
  address?: string;
};
export type AppListingDetail = AppListingCard & {
  contactPhone?: string | null;
  contactEmail?: string | null;
  shortDescription?: string | null;
  longDescription?: string | null;
  address?: string | null;
  location?: any;
  primaryImage?: any;
  galleryImages?: any[];
  lastVerifiedDate?: string | null;
  reviews?: any[];
  coworkingDetails?: {
    capacity?: number | null;
    pricingPlans?: Array<{ type: string; price: number | null; period: string }>;
    openingHours?: Array<{ day: string; opens: string; closes: string }>;
  } | null;
  accommodationDetails?: {
    pricePerNightThb?: { min: number | null; max: number | null };
    openingHours?: Array<{ day: string; opens: string; closes: string }>;
  } | null;
  cafeDetails?: {
    openingHours?: Array<{ day: string; opens: string; closes: string }>;
  } | null;
  nomadFeatures: string[];
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
  ecoTags: string[];
  nomadFeatures: string[];
  priceRanges: string[];
  searchQuery: string;
  sort?: any;
  combinations?: any[];
  combinationOperator?: any;
};