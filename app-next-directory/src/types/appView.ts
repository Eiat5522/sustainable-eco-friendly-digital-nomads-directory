export type AppCity = { id: string; name: string; slug: string; country?: string };
export type AppListingCard = {
  id: string;
  name: string;
  slug: string;
  city: AppCity | null;
  ecoTags: string[];
  priceRange?: 'budget'|'moderate'|'premium';
  website?: string | null;
};
export type AppListingDetail = AppListingCard & {
  contactPhone?: string | null;
  contactEmail?: string | null;
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