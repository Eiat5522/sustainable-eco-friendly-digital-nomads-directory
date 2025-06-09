import {
  getDigitalNomadVenueSummary,
  getDigitalNomadWorkspaces,
  getListingStats,
  getNearbyListings,
  searchListings
} from '@/lib/queries'
import type {
  NearbyVenue,
  SearchResult,
  WorkspaceResult
} from '@/types/query-types'
import { expect, test } from '@playwright/test'
import {
  cleanupTestListings,
  createTestListings,
  SAMPLE_LISTINGS,
  TEST_CITIES,
  validateListingResult
} from './utils/query-test-utils'

const BANGKOK_COORDS = TEST_CITIES.bangkok.coordinates

let testListingIds: string[] = []

test.beforeAll(async () => {
  const createdListings = await createTestListings(SAMPLE_LISTINGS)
  testListingIds = createdListings.map(doc => doc._id)
})

test.afterAll(async () => {
  await cleanupTestListings(testListingIds)
})

test.describe('Complex GROQ Queries', () => {
  test('getListingStats returns aggregated statistics', async () => {
    const stats = await getListingStats()

    expect(stats).toHaveProperty('totalListings')
    expect(stats).toHaveProperty('byCategory')
    expect(stats).toHaveProperty('topCities')
    expect(stats).toHaveProperty('averageRatings')

    expect(stats.totalListings).toBeGreaterThan(0)
    expect(stats.byCategory).toBeInstanceOf(Array)
    expect(stats.topCities).toHaveLength(5)
    expect(stats.averageRatings[0]).toHaveProperty('avgRating')
  })

  test('getDigitalNomadWorkspaces filters by wifi speed', async () => {
    const minWifiSpeed = 50
    const workspaces = await getDigitalNomadWorkspaces(minWifiSpeed)

    expect(workspaces).toBeInstanceOf(Array)
    workspaces.forEach((workspace: WorkspaceResult) => {
      expect(workspace.wifiSpeed).toBeGreaterThanOrEqual(minWifiSpeed)
      expect(workspace.hasWorkspaces).toBe(true)
      expect(workspace.type).toMatch(/^(cafe|coworking)$/)
      validateListingResult(workspace)
    })
  })

  test('searchListings returns relevant results with scores', async () => {
    const searchText = 'coworking'
    const results = await searchListings(searchText)

    expect(results).toBeInstanceOf(Array)
    expect(results.length).toBeGreaterThan(0)
    results.forEach((result: SearchResult) => {
      expect(result).toHaveProperty('score')
      expect(result.score).toBeGreaterThan(0)
      validateListingResult(result)
    })

    // Results should be sorted by score in descending order
    const scores = results.map((r: SearchResult) => r.score)
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
  })

  test('getNearbyListings returns distance-sorted venues', async () => {
    const maxDistanceKm = 10
    const venues = await getNearbyListings(BANGKOK_COORDS, maxDistanceKm)

    expect(venues).toBeInstanceOf(Array)
    venues.forEach((venue: NearbyVenue) => {
      expect(venue.distance).toBeLessThan(maxDistanceKm * 1000) // Distance in meters
      expect(venue).toHaveProperty('location.coordinates')
      validateListingResult(venue)
    })

    // Results should be sorted by distance
    const distances = venues.map((v: NearbyVenue) => v.distance)
    expect(distances).toEqual([...distances].sort((a, b) => a - b))
  })

  test('getDigitalNomadVenueSummary returns detailed statistics', async () => {
    const summary = await getDigitalNomadVenueSummary()

    expect(summary).toHaveProperty('coworkingSpaces')
    expect(summary).toHaveProperty('cafes')

    const { coworkingSpaces, cafes } = summary

    expect(coworkingSpaces).toHaveProperty('total')
    expect(coworkingSpaces).toHaveProperty('withHighSpeedWifi')
    expect(coworkingSpaces).toHaveProperty('with24Access')
    expect(coworkingSpaces).toHaveProperty('priceDistribution')

    expect(cafes).toHaveProperty('total')
    expect(cafes).toHaveProperty('laptopFriendly')
    expect(cafes).toHaveProperty('withGoodWifi')
    expect(cafes).toHaveProperty('withoutTimeLimits')
  })

  test('getListingStats handles empty categories gracefully', async () => {
    const stats = await getListingStats()
    const emptyCategories = stats.byCategory.filter(cat => cat.count === 0)
    expect(emptyCategories).toBeDefined()
  })

  test('getDigitalNomadWorkspaces filters coworking spaces by amenities', async () => {
    const workspaces = await getDigitalNomadWorkspaces(0) // No minimum wifi speed
    const coworkingSpaces = workspaces.filter((w: WorkspaceResult) => w.type === 'coworking')

    coworkingSpaces.forEach((space: WorkspaceResult) => {
      expect(space.hasWorkspaces).toBe(true)
      if (space.wifiSpeed) {
        expect(typeof space.wifiSpeed).toBe('number')
      }
    })
  })

  test('searchListings handles special characters correctly', async () => {
    const specialChars = 'café & co-working'
    const results = await searchListings(specialChars)
    expect(Array.isArray(results)).toBe(true)
  })

  test('getNearbyListings respects maximum distance', async () => {
    const maxDistanceKm = 5
    const venues = await getNearbyListings(BANGKOK_COORDS, maxDistanceKm)

    venues.forEach((venue: NearbyVenue) => {
      expect(venue.distance).toBeLessThan(maxDistanceKm * 1000)
    })
  })

  test('getDigitalNomadVenueSummary calculates correct totals', async () => {
    const summary = await getDigitalNomadVenueSummary()

    expect(summary.coworkingSpaces.total).toBeGreaterThanOrEqual(
      summary.coworkingSpaces.withHighSpeedWifi
    )
    expect(summary.cafes.total).toBeGreaterThanOrEqual(
      summary.cafes.laptopFriendly
    )
  })
})
