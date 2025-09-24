import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import type { AxeResults, AxeViolation } from '@axe-core/playwright'
import { mockDiscoveryMetadata } from '../utils/discovery-helpers'

async function assertNoCriticalViolations(context: string, page: Page) {
  const results: AxeResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  const criticalIssues = results.violations.filter((violation: AxeViolation) => violation.impact === 'critical')
  expect(criticalIssues, `${context} should not have critical accessibility violations`).toHaveLength(0)
}
await page.getByRole('searchbox', { name: 'Search venues' }).click();
await page.getByRole('searchbox', { name: 'Search venues' }).click();
await page.getByRole('searchbox', { name: 'Search venues' }).fill('k');
await page.getByRole('combobox', { name: 'Select enquiry type' }).click();
await page.getByRole('combobox', { name: 'Select enquiry type' }).click();
await page.getByRole('textbox', { name: 'Email Address', exact: true }).click();
await page.getByRole('textbox', { name: 'Email Address', exact: true }).fill('eia');
await page.getByRole('textbox', { name: 'Email Address', exact: true }).fill('eiat');
await page.getByRole('textbox', { name: 'Email Address', exact: true }).fill('eiat52@gm');
await page.getByRole('textbox', { name: 'Email Address', exact: true }).fill('eiat52@gmail.com');
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
