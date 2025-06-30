// src/lib/listings.ts
import { Listing } from '../types/listings';
import listingsData from '../data/listings.json';

export function getListingsByCity(city: string): Listing[] {
  const cityLower = city.toLowerCase();
  return (listingsData as unknown as Listing[]).filter(l => l.city.toLowerCase() === cityLower);
}

export interface ListingFilter {
  city?: string;
  category?: string;
  hasEcoTags?: boolean;
  hasDnFeatures?: boolean;
}

export function filterListings(filters: ListingFilter = {}): Listing[] {
  let result = (listingsData as unknown as Listing[]);

  if (filters.city) {
    const cityLower = filters.city.toLowerCase();
    result = result.filter(l => l.city.toLowerCase() === cityLower);
  }

  if (filters.category) {
    const catLower = filters.category.toLowerCase();
    result = result.filter(l => l.category.toLowerCase() === catLower);
  }

  if (filters.hasEcoTags) {
    result = result.filter(l => 
      Array.isArray(l.eco_focus_tags) && l.eco_focus_tags.length > 0
    );
  }

  if (filters.hasDnFeatures) {
    result = result.filter(l => 
      Array.isArray(l.digital_nomad_features) && l.digital_nomad_features.length > 0
    );
  }

  return result;
}
