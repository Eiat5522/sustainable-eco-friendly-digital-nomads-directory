declare module '@/tests/helpers/test-data' {
  import type { Role } from '@/models/User';
  import type { AppReview } from '@/types/appView';
  import type { EcoTag, Listing } from '@/types/listings';

  export interface TestUser {
    id: string;
    name: string;
    email: string;
    role: Role;
    plan: 'free' | 'premium';
    password: string;
    sessionToken: string;
    image?: string;
  }

  export interface TestCity {
    id: string;
    name: string;
    slug: string;
    country: string;
    description: string;
    heroImage: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    sustainabilityScore: number;
    highlights: string[];
    listingIds: string[];
  }

  export interface TestFavorite {
    id: string;
    userId: string;
    listingId: string;
    createdAt: string;
  }

  export type TestEcoTag = EcoTag;

  export interface TestData {
    users: TestUser[];
    listings: Listing[];
    cities: TestCity[];
    favorites: TestFavorite[];
    reviews: AppReview[];
    ecoTags: TestEcoTag[];
  }

  export interface TestSession {
    token: string;
    user: TestUser;
  }

  export const TEST_SESSION_COOKIE_NAME: string;
  export const mockListings: Listing[];

  export function createTestData(overrides?: Partial<TestData>): TestData;
  export function getTestUser(role: Role): TestUser | undefined;
  export function getSessionForRole(role: Role): TestSession | undefined;
  export function getFavoritesForUser(userId: string): TestFavorite[];
  export function getReviewsForListing(listingId: string): AppReview[];
  export function getListingBySlug(slug: string): Listing | undefined;
  export function listCities(): TestCity[];
  export function listEcoTags(): TestEcoTag[];
  export function pickTags(...slugs: string[]): EcoTag[];
}
