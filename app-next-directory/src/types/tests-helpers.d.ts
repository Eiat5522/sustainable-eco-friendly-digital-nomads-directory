declare module '@/tests/helpers/test-data' {
  export function createTestData(...args: any[]): any;
  export function getFavoritesForUser(userId: string): any[];
  export function getReviewsForListing(listingId: string): any[];
  export function listCities(): any[];
  export const defaultTestData: any;
}
