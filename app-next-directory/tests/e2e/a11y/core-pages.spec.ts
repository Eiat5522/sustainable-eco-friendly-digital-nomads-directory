import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockDiscoveryMetadata } from '../utils/discovery-helpers'

async function assertNoCriticalViolations(context: string, page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  const criticalIssues = results.violations.filter((violation) => violation.impact === 'critical')
  expect(criticalIssues, `${context} should not have critical accessibility violations`).toHaveLength(0)
}

test.describe('Accessibility smoke checks', () => {
  test('home page has no critical axe violations', async ({ page }) => {
    await page.goto('/')
    await assertNoCriticalViolations('Home page', page)
  })

  test('listing detail preview passes accessibility scan', async ({ page }) => {
    await page.goto('/page.listingdetail')
    await assertNoCriticalViolations('Listing detail preview', page)
  })

  test('search page supports focus order and has no critical issues', async ({ page }) => {
    await mockDiscoveryMetadata(page)
    await page.goto('/search')

    await assertNoCriticalViolations('Search page', page)

    const searchForm = page.getByTestId('search-form')
    await expect(searchForm).toBeVisible()

    const searchInput = page.locator('#search-page-input')
    const searchButton = page.getByRole('button', { name: 'Search' })
    const cityFilter = page.getByRole('button', { name: /Select cities/i })

    await searchInput.focus()
    await expect(searchInput).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(searchButton).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(cityFilter).toBeFocused()
  })
})
