import { expect, test } from '@playwright/test'
import { discoveryListings, mockDiscoveryMetadata } from '../utils/discovery-helpers'

test.describe('Search discovery experience', () => {
  test.beforeEach(async ({ page }) => {
    await mockDiscoveryMetadata(page)
  })

  test('submitting a query displays filtered results with preserved parameters', async ({ page }) => {
    await page.goto('/search')

    const searchField = page.getByLabel('Search venues')
    await searchField.fill('cowork')
    await page.getByRole('button', { name: 'Search' }).click()

    await page.waitForURL('**/search/results**')
    await expect(page).toHaveURL(/q=cowork/i)

    await expect(
      page.getByRole('link', { name: discoveryListings.find((listing) => listing.slug === 'green-cowork-bangkok')?.name ?? '' })
    ).toBeVisible()
  })

  test('shows an empty state when nothing matches the filters', async ({ page }) => {
    await page.goto('/search/results?q=no-results-here')
    await expect(page.getByText('No results found.', { exact: true })).toBeVisible()
  })

  test('navigates to the listing detail route when a result is selected', async ({ page }) => {
    const targetListing = discoveryListings.find((listing) => listing.slug === 'green-cowork-bangkok')
    if (!targetListing) throw new Error('Expected discovery listing not found')

    await page.goto('/search/results?q=coworking')

    await Promise.all([
      page.waitForURL(`**/listings/${targetListing.slug}`),
      page.getByRole('link', { name: targetListing.name }).first().click(),
    ])

    await expect(page).toHaveURL(new RegExp(`/listings/${targetListing.slug}`))
  })
})
