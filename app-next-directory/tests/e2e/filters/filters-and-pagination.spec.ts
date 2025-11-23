import { expect, test } from '@playwright/test';
import { discoveryListings, mockDiscoveryMetadata } from '../utils/discovery-helpers';

test.describe('Search filters and pagination', () => {
  test.beforeEach(async ({ page }) => {
    await mockDiscoveryMetadata(page);
  });

  test('allows combining filters and clearing them', async ({ page }) => {
    await page.goto('/search/results');

    const cityFilterTrigger = page.getByRole('button', { name: /Select cities/i });
    const workspaceFilterTrigger = page.getByRole('button', { name: /Select workspace types/i });
    const amenityFilterTrigger = page.getByRole('button', { name: /Select amenities/i });
    const bangkokOption = page.getByRole('menuitemcheckbox', { name: 'Bangkok' });
    const coworkingOption = page.getByRole('menuitemcheckbox', { name: /Coworking/i });
    const fastWifiOption = page.getByRole('menuitemcheckbox', { name: 'Fast WiFi' });

    await cityFilterTrigger.click();
    await bangkokOption.waitFor({ state: 'visible' });
    await bangkokOption.click();
    await page.keyboard.press('Escape');

    await workspaceFilterTrigger.click();
    await coworkingOption.waitFor({ state: 'visible' });
    await coworkingOption.click();
    await page.keyboard.press('Escape');

    await amenityFilterTrigger.click();
    await fastWifiOption.waitFor({ state: 'visible' });
    await fastWifiOption.click();
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: /^Search$/ }).click();

    await expect(page).toHaveURL(/destination=Bangkok/);
    await expect(page).toHaveURL(/category=coworking/);
    await expect(page).toHaveURL(/amenities=Fast(?:\+|%20)WiFi/);

    await expect(page.getByRole('link', { name: 'Green Cowork Bangkok' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ocean Colab Phuket' })).toHaveCount(0);

    await cityFilterTrigger.click();
    await bangkokOption.waitFor({ state: 'visible' });
    await bangkokOption.click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: /Select cities \(1\)/i })).toHaveCount(0);

    await workspaceFilterTrigger.click();
    await coworkingOption.waitFor({ state: 'visible' });
    await coworkingOption.click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: /Select workspace types \(1\)/i })).toHaveCount(
      0
    );

    await amenityFilterTrigger.click();
    await fastWifiOption.waitFor({ state: 'visible' });
    await fastWifiOption.click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: /Select amenities \(1\)/i })).toHaveCount(0);

    await page.getByRole('button', { name: /^Search$/ }).click();

    await expect(page).not.toHaveURL(/destination=/, { timeout: 15000 });
    await expect(page).not.toHaveURL(/category=/, { timeout: 15000 });
    await expect(page).not.toHaveURL(/amenities=/, { timeout: 15000 });
    const listingLinks = await page.locator('a[href^="/listings/"]').count();
    expect(listingLinks).toBeGreaterThan(1);
  });

  test('supports pagination with URL persistence', async ({ page }) => {
    await page.goto('/search/results?limit=2');

    const initialLinks = await page.locator('a[href^="/listings/"]').count();
    expect(initialLinks).toBe(2);

    const nextLink = page.getByRole('link', { name: 'Next' }).first();
    await Promise.all([page.waitForURL(/page=2/, { timeout: 15000 }), nextLink.click()]);

    const pageTwoListing = discoveryListings.find(listing => listing.slug === 'plant-powered-cafe');
    if (pageTwoListing) {
      await expect(page.getByRole('link', { name: pageTwoListing.name })).toBeVisible();
    }

    await page.reload();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.locator('select[name="limit"]').first()).toHaveValue('2');

    await Promise.all([
      page.waitForURL(/page=1/, { timeout: 15000 }),
      page.getByRole('link', { name: 'Prev' }).first().click(),
    ]);
  });
});
