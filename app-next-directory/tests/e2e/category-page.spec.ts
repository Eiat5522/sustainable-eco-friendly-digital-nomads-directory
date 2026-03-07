import { expect, test } from '@playwright/test';

test.describe('[E2E] Categories pages', () => {
  test('renders categories index and links to detail pages', async ({ page }) => {
    await page.goto('/categories');

    await expect(page.getByRole('heading', { level: 1, name: 'Browse Categories' })).toBeVisible();

    const coworkingHeading = page
      .getByRole('heading', { level: 2, name: /Coworking Space/i })
      .first();
    const coworkingLink = coworkingHeading.locator('xpath=ancestor::a[1]');
    await expect(coworkingLink).toHaveAttribute('href', '/categories/coworking');
  });

  test('renders category detail with listing grid', async ({ page }) => {
    await page.goto('/categories/coworking');

    await expect(page.getByRole('heading', { level: 1, name: 'Coworking Space' })).toBeVisible();
    await expect(page.getByText('Green Cowork Bangkok')).toBeVisible();

    const listingLink = page.getByRole('link', { name: /Green Cowork Bangkok/i }).first();
    await expect(listingLink).toHaveAttribute('href', '/listings/green-cowork-bangkok');
  });

  test('legacy category route redirects to canonical categories route', async ({ page }) => {
    await page.goto('/category/coworking');
    await expect(page).toHaveURL(/\/categories\/coworking$/);
  });
});
