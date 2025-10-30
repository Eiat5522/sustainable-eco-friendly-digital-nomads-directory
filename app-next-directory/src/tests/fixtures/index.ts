import { createTestData } from '@/tests/helpers/test-data'

export type TestData = ReturnType<typeof createTestData>
export type TestUser = TestData['users'][number]
export type TestCity = TestData['cities'][number]
export type TestFavorite = TestData['favorites'][number]
export type TestReview = TestData['reviews'][number]

export const integrationTestData = createTestData()

export const integrationListings = integrationTestData.listings
export const integrationUsers = integrationTestData.users
export const integrationCities = integrationTestData.cities
export const integrationFavorites = integrationTestData.favorites
export const integrationReviews = integrationTestData.reviews
