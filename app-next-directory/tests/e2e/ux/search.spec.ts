import { expect, test } from '@playwright/test';

import { discoveryListings, mockDiscoveryMetadata } from '../utils/discovery-helpers';

test.describe('[E2E] Search UX', () => {
  test.beforeEach(async ({ page }) => {
    await mockDiscoveryMetadata(page);
  });

  test('renders the search form and filter controls', async ({ page }) => {
    await page.goto('/search/results');

    await expect(page.getByTestId('search-form')).toBeVisible();
    await expect(page.getByLabel('Search venues')).toBeVisible();

    await expect(page.getByRole('button', { name: /^Search$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /select cities/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /select workspace types/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /select amenities/i })).toBeVisible();
  });

  test('submitting a query shows results and preserves URL parameters', async ({ page }) => {
    await page.goto('/search/results');

    await page.getByLabel('Search venues').fill('cowork');
    await page.getByRole('button', { name: /^Search$/i }).click();

    await expect(page).toHaveURL(/\/search\/results\?.*\bq=cowork/i);
    await expect(page.getByRole('heading', { name: /search results/i })).toBeVisible();

    const expectedName =
      discoveryListings.find(listing => listing.slug === 'green-cowork-bangkok')?.name ?? '';
    if (!expectedName) throw new Error('Expected discovery listing fixture not found');

    await expect(page.getByRole('link', { name: expectedName }).first()).toBeVisible();
  });

  test('applies city and category filters', async ({ page }) => {
    await page.goto('/search/results');

    await page.getByRole('button', { name: /select cities/i }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Bangkok' }).click();
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: /select workspace types/i }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Coworking' }).click();
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: /^Search$/i }).click();

    await expect(page).toHaveURL(/destination=Bangkok/);
    await expect(page).toHaveURL(/category=coworking/);
  });
});

