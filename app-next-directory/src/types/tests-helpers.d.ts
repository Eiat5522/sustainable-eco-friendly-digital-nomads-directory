declare module '@/tests/helpers/test-data' {
  import type { TestData, TestCity, TestFavorite } from '@/tests/helpers/test-data';
  import type { AppReview } from '@/types/appView';

  export function createTestData(overrides?: Partial<TestData>): TestData;
  export function getFavoritesForUser(userId: string): TestFavorite[];
  export function getReviewsForListing(listingId: string): AppReview[];
  export function listCities(): TestCity[];
  export const defaultTestData: TestData;
}
