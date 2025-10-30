import type { TestCity, TestData, TestFavorite, TestReview, TestUser } from '@/tests/helpers/test-data';
import { TEST_SESSION_COOKIE_NAME, createTestData, getSessionForRole, getTestUser, listCities } from '@/tests/helpers/test-data';

export const TEST_DATASET: TestData = createTestData();

export const TEST_LISTINGS = TEST_DATASET.listings;
export const TEST_USERS: TestUser[] = TEST_DATASET.users;
export const TEST_CITIES: TestCity[] = TEST_DATASET.cities;
export const TEST_FAVORITES: TestFavorite[] = TEST_DATASET.favorites;
export const TEST_REVIEWS: TestReview[] = TEST_DATASET.reviews;

export const getTestData = (overrides?: Partial<TestData>): TestData => createTestData(overrides);

export const getCityBySlug = (slug: string): TestCity | undefined =>
  listCities().find((city) => city.slug === slug);

export const getCredentialsForRole = (role: TestUser['role']) => {
  const user = getTestUser(role);
  if (!user) return undefined;
  return {
    email: user.email,
    password: user.password,
    name: user.name,
    role: user.role,
    sessionToken: user.sessionToken,
  } as const;
};

export { TEST_SESSION_COOKIE_NAME, getSessionForRole };
