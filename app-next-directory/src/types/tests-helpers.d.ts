declare module '@/tests/helpers/test-data' {
  export function createTestData(...args: unknown[]): unknown;
  export function getFavoritesForUser(userId: string): unknown[];
  export function getReviewsForListing(listingId: string): unknown[];
  export function listCities(): unknown[];
  export const defaultTestData: unknown;
}
