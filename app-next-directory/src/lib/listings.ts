// src/lib/listings.ts
import listings from '../data/listings.json';
import { Listing } from '../types/listings';

export function getListingsByCity(city: string): Listing[] {
  return listings.filter(
    (listing) =>
      !!listing.city &&
      listing.city.toLowerCase() === city.trim().toLowerCase() &&
      (listing.category === 'coworking' ||
        listing.category === 'cafe' ||
        listing.category === 'accommodation')
  ) as Listing[];
}

type FilterOptions = {
  city?: string;
  category?: 'coworking' | 'cafe' | 'accommodation';
  hasEcoTags?: boolean;
  hasDnFeatures?: boolean;
};

export function filterListings(options: FilterOptions): Listing[] {
  return listings.filter((listing) => {
    if (options.city) {
      if (
        !listing.city ||
        listing.city.toLowerCase() !== options.city.trim().toLowerCase()
      ) {
        return false;
      }
    }
    if (options.category) {
      if (listing.category !== options.category) {
        return false;
      }
    }
    if (options.hasEcoTags) {
      if (!listing.eco_focus_tags || listing.eco_focus_tags.length === 0) {
        return false;
      }
    }
    if (options.hasDnFeatures) {
      if (
        !listing.digital_nomad_features ||
        listing.digital_nomad_features.length === 0
      ) {
        return false;
      }
    }
    // Ensure category is valid for Listing type
    return (
      listing.category === 'coworking' ||
      listing.category === 'cafe' ||
      listing.category === 'accommodation'
    );
  }) as Listing[];
}
