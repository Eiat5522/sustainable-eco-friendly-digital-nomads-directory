import { expect, test } from '@playwright/test';

test.describe('[E2E] City page', () => {
  test('renders city overview content and listings', async ({ page }) => {
    await page.goto('/cities/testopolis');

    await expect(page.getByRole('heading', { level: 1, name: 'Testopolis' })).toBeVisible();

    await expect(page.getByText('120↓ / 40↑ Mbps')).toBeVisible();

    await expect(page.getByTestId('city-about-section')).toBeVisible();
    await expect(page.getByTestId('city-listings-section')).toBeVisible();

    await expect(
      page.getByTestId('related-listing-card').filter({ hasText: 'Eco Hub Workspace' })
    ).toBeVisible();
  });

  test('renders a city with no listings without crashing', async ({ page }) => {
    await page.goto('/cities/empty-city');

    await expect(page.getByRole('heading', { level: 1, name: 'Empty City' })).toBeVisible();
    await expect(page.getByTestId('city-about-section')).toBeVisible();
    await expect(page.getByTestId('city-listings-section')).toHaveCount(0);
    await expect(page.getByTestId('related-listing-card')).toHaveCount(0);
  });
});
