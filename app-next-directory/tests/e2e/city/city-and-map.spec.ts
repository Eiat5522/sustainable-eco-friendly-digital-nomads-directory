import { expect, test } from '@playwright/test'
import { discoveryListings } from '../utils/discovery-helpers'

test.describe('City page tabs and map markers', () => {
  test('switching tabs updates the visible section and map markers link to listings', async ({ page }) => {
    await page.goto('/cities/bangkok')

    await expect(page.getByRole('heading', { name: 'Bangkok' })).toBeVisible()
    await expect(page.getByTestId('city-about-section')).toBeVisible()

    await page.getByTestId('city-tab-listings').click()
    await expect(page.getByTestId('city-listings-section')).toBeVisible()
    await expect(page.getByTestId('city-about-section')).toBeHidden()

    await page.getByTestId('city-tab-map').click()
    const markers = page.getByTestId('city-map-marker')

    const bangkokListings = discoveryListings.filter((listing) => listing.city._id === 'city-bangkok' && listing.location)
    expect(bangkokListings.length).toBeGreaterThan(0)
    await expect(markers).toHaveCount(bangkokListings.length)

    await expect(markers.first()).toHaveAttribute('href', `/listings/${bangkokListings[0].slug}`)
  })
})
