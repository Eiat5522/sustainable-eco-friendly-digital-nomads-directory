import listingsData from '@/data/listings.json';
import { Listing } from '@/types/listings';

export function getListings(): Listing[] {
  return (listingsData as unknown) as Listing[];
}

export function getListingsByCategory(category: Listing['category']): Listing[] {
  return getListings().filter(listing => listing.category === category);
}

export function getListingBySlug(slug: string): Listing | undefined {
  return getListings().find(listing => listing.slug === slug);
}


export function getListingsByCity(city: string): Listing[] {
  return getListings().filter(listing =>
    listing.city.toLowerCase() === city.toLowerCase()
  );
}

export function getUniqueCities(): string[] {
  return Array.from(new Set(getListings().map(listing => listing.city)));
}

export function filterListings({
  category,
  city,
  hasEcoTags,
  hasDnFeatures,
}: {
  category?: Listing['category'];
  city?: string;
  hasEcoTags?: boolean;
  hasDnFeatures?: boolean;
}): Listing[] {
  return getListings().filter(listing => {
    if (category && listing.category !== category) return false;
    if (city && listing.city.toLowerCase() !== city.toLowerCase()) return false;
    if (hasEcoTags && listing.eco_focus_tags.length === 0) return false;
    if (hasDnFeatures && listing.digital_nomad_features.length === 0) return false;
    return true;
  });
}
