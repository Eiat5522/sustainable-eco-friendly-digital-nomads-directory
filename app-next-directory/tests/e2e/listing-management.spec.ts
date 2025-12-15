import { expect, test } from '@playwright/test';

import { loginAs } from './helpers/auth';

const BASE_URL = process.env.E2E_BASE_URL ?? process.env.BASE_URL ?? 'http://localhost:3000';

test.describe('[E2E] Listing management', () => {
  test('venue owners can access listing management', async ({ page }) => {
    await loginAs(
      page,
      process.env.E2E_VENUE_OWNER_EMAIL ?? 'venue@example.com',
      process.env.E2E_VENUE_OWNER_PASSWORD ?? 'password123'
    );

    await page.goto(`${BASE_URL}/dashboard/listings`);
    await expect(page.getByRole('heading', { name: 'Manage Your Listings' })).toBeVisible();
  });

  test('regular users cannot access venue owner listing management', async ({ page }) => {
    await loginAs(
      page,
      process.env.E2E_USER_EMAIL ?? 'e2e-test@example.com',
      process.env.E2E_USER_PASSWORD ?? 'password123'
    );

    await page.goto(`${BASE_URL}/dashboard/listings`);

    const heading = page.getByRole('heading', { name: 'Manage Your Listings' });
    await expect(heading).toHaveCount(0);
    await expect(page).not.toHaveURL(/\/dashboard\/listings$/);
  });

  test('venue owners can open the new listing form', async ({ page }) => {
    await loginAs(
      page,
      process.env.E2E_VENUE_OWNER_EMAIL ?? 'venue@example.com',
      process.env.E2E_VENUE_OWNER_PASSWORD ?? 'password123'
    );

    await page.goto(`${BASE_URL}/dashboard/listings/new`);
    await expect(page.getByRole('heading', { name: 'Add New Listing' })).toBeVisible();
    await expect(page.getByLabel('Listing Name')).toBeVisible();
  });
});
