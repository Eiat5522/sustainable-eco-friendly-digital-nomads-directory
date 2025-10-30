import { expect, test, type Page } from '@playwright/test';

const HOME_PAGE = '/';
const LISTINGS_PAGE = '/listings';
const LISTING_DETAIL = '/listings/banyan-tree-phuket';
const SEARCH_PAGE = '/search';

async function mockAnonymousSession(page: Page) {
  await page.route('**/api/auth/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });
}

async function mockListingsAPI(page: Page) {
  const mockListings = [
    {
      id: '1',
      slug: 'banyan-tree-phuket',
      name: 'Banyan Tree Phuket',
      city: 'Phuket',
      category: 'Accommodation',
      ecoFocusTags: ['Solar Powered'],
    },
    {
      id: '2',
      slug: 'green-hub-lisbon',
      name: 'Green Hub Lisbon',
      city: 'Lisbon',
      category: 'Coworking',
      ecoFocusTags: ['Recycling'],
    },
  ];

  await page.route('**/api/listings**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ listings: mockListings, total: mockListings.length }),
    });
  });
}

async function mockListingDetailAPI(page: Page) {
  const mockListing = {
    id: '1',
    slug: 'banyan-tree-phuket',
    name: 'Banyan Tree Phuket',
    description: 'Luxury eco-resort',
    city: 'Phuket',
    country: 'Thailand',
    category: 'Accommodation',
    ecoFocusTags: ['Solar Powered', 'Zero Waste'],
    amenities: ['WiFi', 'Pool'],
    reviews: [],
  };

  await page.route('**/api/listings/banyan-tree-phuket**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockListing),
    });
  });
}

test.describe('[E2E] Browser Navigation (Back/Forward)', () => {
  test.beforeEach(async ({ page }) => {
    await mockAnonymousSession(page);
    await mockListingsAPI(page);
    await mockListingDetailAPI(page);
  });

  test('allows navigation using browser back button', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(HOME_PAGE);

    const listingsLink = page.getByRole('link', { name: /listings/i }).first();
    await listingsLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(new RegExp(LISTINGS_PAGE));

    await page.goBack();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(HOME_PAGE);

    const heading = page.getByRole('heading', { level: 1 }).first();
    await expect(heading).toBeVisible();
  });

  test('allows navigation using browser forward button', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await page.waitForLoadState('networkidle');

    const listingsLink = page.getByRole('link', { name: /listings/i }).first();
    await listingsLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(new RegExp(LISTINGS_PAGE));

    await page.goBack();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(HOME_PAGE);

    await page.goForward();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(new RegExp(LISTINGS_PAGE));
  });

  test('maintains scroll position when navigating back from listing detail', async ({ page }) => {
    await page.goto(LISTINGS_PAGE);
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(300);

    const listingCard = page.getByRole('link', { name: /banyan tree/i }).first();
    await listingCard.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(new RegExp(LISTING_DETAIL));

    await page.goBack();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(new RegExp(LISTINGS_PAGE));

    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(100);
  });

  test('preserves filter state when navigating back to listings', async ({ page }) => {
    await page.goto(LISTINGS_PAGE);
    await page.waitForLoadState('networkidle');

    const cityFilter = page.getByLabel(/city/i).or(page.getByTestId('city-filter'));
    if (await cityFilter.isVisible()) {
      await cityFilter.click();
      const phuketOption = page.getByText('Phuket').first();
      if (await phuketOption.isVisible()) {
        await phuketOption.click();
      }
    }

    await page.waitForTimeout(500);
    const currentURL = page.url();

    const listingCard = page.getByRole('link').first();
    await listingCard.click();
    await page.waitForLoadState('networkidle');

    await page.goBack();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toBe(currentURL);
  });

  test('navigates through multiple pages using back/forward', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await page.waitForLoadState('networkidle');

    await page.goto(LISTINGS_PAGE);
    await page.waitForLoadState('networkidle');

    await page.goto(SEARCH_PAGE);
    await page.waitForLoadState('networkidle');

    await page.goBack();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(new RegExp(LISTINGS_PAGE));

    await page.goBack();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(HOME_PAGE);

    await page.goForward();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(new RegExp(LISTINGS_PAGE));

    await page.goForward();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(new RegExp(SEARCH_PAGE));
  });

  test('handles back navigation from breadcrumb navigation', async ({ page }) => {
    await page.goto(LISTING_DETAIL);
    await page.waitForLoadState('networkidle');

    const breadcrumbLink = page.getByRole('link', { name: /listings/i }).first();
    if (await breadcrumbLink.isVisible()) {
      await breadcrumbLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(new RegExp(LISTINGS_PAGE));

      await page.goBack();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(new RegExp(LISTING_DETAIL));
    }
  });

  test('handles browser back after form submission', async ({ page }) => {
    await page.goto(SEARCH_PAGE);
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/search/i).or(page.getByRole('searchbox'));
    if (await searchInput.isVisible()) {
      await searchInput.fill('coworking');
      await searchInput.press('Enter');
      await page.waitForLoadState('networkidle');

      const urlAfterSearch = page.url();

      await page.goBack();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(SEARCH_PAGE);

      await page.goForward();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toBe(urlAfterSearch);
    }
  });
});
