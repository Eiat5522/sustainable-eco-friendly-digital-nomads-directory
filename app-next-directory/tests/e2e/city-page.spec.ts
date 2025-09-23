import { expect, test } from '@playwright/test';

test.describe('[E2E] City page', () => {
  test('switching tabs reveals the correct content', async ({ page }) => {
    await page.goto('/cities/testopolis');

    await expect(page.getByRole('heading', { level: 1, name: 'Testopolis' })).toBeVisible();

    const overviewTab = page.getByRole('tab', { name: 'Overview' });
    const listingsTab = page.getByRole('tab', { name: 'Listings' });

    await expect(overviewTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('120↓ / 40↑ Mbps')).toBeVisible();
    await expect(page.getByText('Eco Hub Workspace')).not.toBeVisible();

    await listingsTab.click();

    await expect(listingsTab).toHaveAttribute('aria-selected', 'true');
    await expect(overviewTab).toHaveAttribute('aria-selected', 'false');
    await expect(page.getByText('Eco Hub Workspace')).toBeVisible();
    await expect(page.getByText('120↓ / 40↑ Mbps')).not.toBeVisible();
  });

  test('shows an empty state when the city has no listings', async ({ page }) => {
    await page.goto('/cities/empty-city');

    await page.getByRole('tab', { name: 'Listings' }).click();

    await expect(page.getByText(/No listings/i)).toBeVisible();
  });
});
