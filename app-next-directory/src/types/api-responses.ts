// Lightweight API response types for filter metadata
// These are intentionally minimal to keep UI consumption simple.

export interface City {
  name: string;
  // add other expected fields when needed (e.g., slug, country)
}

export interface CityResponse {
  cities: City[];
}

export interface CategoryResponse {
  categories: string[];
}

export interface Amenity {
  name: string;
  // add other expected fields when needed (e.g., id, description)
}

export interface AmenityResponse {
  amenities: Amenity[];
}

