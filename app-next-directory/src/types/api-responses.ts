// Lightweight API response types for filter metadata
// These are intentionally minimal to keep UI consumption simple.

/**
 * City item returned by GET /api/cities
 * Minimal city shape used by the filters UI.
 */
export interface City {
  readonly name: string;
  // add other expected fields when needed (e.g., slug, country)
}

/**
 * Response payload for GET /api/cities
 * Provides a list of cities available for filtering.
 */
export interface CityResponse {
  readonly cities: ReadonlyArray<City>;
}

/**
 * Response payload for GET /api/categories
 * Returns the distinct listing categories used for filtering.
 */
export interface CategoryResponse {
  readonly categories: ReadonlyArray<string>;
}

/**
 * Internal shape for listing "types" collections (no direct endpoint)
 * Kept for future compatibility if /api/types is introduced.
 */
export interface TypeResponse {
  readonly types: ReadonlyArray<string>;
}

/**
 * Amenity item returned by GET /api/amenities
 * Minimal amenity shape used by the filters UI.
 */
export interface Amenity {
  readonly name: string;
  // add other expected fields when needed (e.g., id, description)
}

/**
 * Response payload for GET /api/amenities
 * Provides a list of amenities available for filtering.
 */
export interface AmenityResponse {
  readonly amenities: ReadonlyArray<Amenity>;
}
