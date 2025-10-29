import { createTestData } from '@/tests/helpers/test-data'

export type { TestData, TestUser, TestCity, TestFavorite, TestReview } from '@/tests/helpers/test-data'

export const integrationTestData = createTestData()

export const integrationListings = integrationTestData.listings
export const integrationUsers = integrationTestData.users
export const integrationCities = integrationTestData.cities
export const integrationFavorites = integrationTestData.favorites
export const integrationReviews = integrationTestData.reviews
