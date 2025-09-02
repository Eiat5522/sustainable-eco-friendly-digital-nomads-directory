// Lightweight API response types for filter metadata
// These are intentionally minimal to keep UI consumption simple.

/**
 * City item returned by GET /api/cities
 * Minimal city shape used by the filters UI.
 */
export interface City {
  readonly _id: string;
  readonly name: string;
  readonly slug: { current: string };
  // add other expected fields when needed (e.g., country)
}

/**
 * Response payload for GET /api/cities
 * Provides a list of cities available for filtering.
 */
export interface CityResponse {
    readonly cities: readonly City[];

}

/**
 * Response payload for GET /api/categories
 * Returns the distinct listing categories used for filtering.
 */
export interface CategoryResponse {
  readonly categories: readonly string[];
}

/**
 * Internal shape for listing "types" collections (no direct endpoint)
 * Kept for future compatibility if /api/types is introduced.
 */
/** @internal */
interface TypeResponse {
  readonly types: readonly string[];
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
