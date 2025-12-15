import { expect, test } from '@playwright/test';
import { discoveryListings } from '../utils/discovery-helpers';

test.describe('[E2E] City page listings', () => {
  test('renders city content and links to listing detail pages', async ({ page }) => {
    await page.goto('/cities/bangkok');

    await expect(page.getByRole('heading', { level: 1, name: 'Bangkok' })).toBeVisible();
    await expect(page.getByTestId('city-about-section')).toBeVisible();

    await expect(page.getByTestId('city-listings-section')).toBeVisible();

    const bangkokListings = discoveryListings.filter(
      listing => listing.city._id === 'city-bangkok' && listing.location
    );
    expect(bangkokListings.length).toBeGreaterThan(0);

    await expect(page.getByTestId('related-listing-card')).toHaveCount(bangkokListings.length);
    await expect(page.getByTestId('related-listing-card').first()).toHaveAttribute(
      'href',
      `/listings/${bangkokListings[0].slug}`
    );
  });
});
