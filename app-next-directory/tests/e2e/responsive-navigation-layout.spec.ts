import { expect, type Page, test } from '@playwright/test';

const NAV_LINKS = ['Home', 'Search', 'Blog', 'Contact Us'] as const;

const MOCK_FEATURED_LISTINGS = [
  {
    id: 'listing-1',
    slug: 'green-haven-coworking',
    name: 'Green Haven Coworking',
    imageUrl: '',
    city: 'Lisbon, Portugal',
    amenityNames: ['High-Speed WiFi', '24/7 Access'],
    ecoFocusTags: ['Solar Powered', 'Zero Waste'],
    featured: true,
  },
];

const MOCK_CITIES = [
  {
    id: 'city-1',
    slug: 'lisbon',
    name: 'Lisbon',
    country: 'Portugal',
    sustainabilityScore: 92,
    highlights: ['Coastal views', 'Green initiatives'],
    imageUrl: '',
  },
  {
    id: 'city-2',
    slug: 'chiang-mai',
    name: 'Chiang Mai',
    country: 'Thailand',
    sustainabilityScore: 88,
    highlights: ['Local markets', 'Bike friendly'],
    imageUrl: '',
  },
];

async function mockAnonymousSession(page: Page) {
  await page.route('**/api/auth/session', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });
}

async function mockHomePageApis(page: Page) {
  await page.route('**/api/featured-listings*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ listings: MOCK_FEATURED_LISTINGS }),
    });
  });

  await page.route('**/api/cities*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ cities: MOCK_CITIES }),
    });
  });
}

async function expectNoHorizontalOverflow(page: Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));

  expect(scrollWidth, 'layout should not overflow horizontally').toBeLessThanOrEqual(
    innerWidth + 1
  );
}

test.describe('[E2E] Responsive navigation layout', () => {
  test.beforeEach(async ({ page }) => {
    await mockAnonymousSession(page);
    await mockHomePageApis(page);
  });

  test('keeps navigation usable on a 375px mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const header = page.getByRole('banner');
    await expect(header).toBeVisible();

    const logoLink = header.getByRole('link', { name: /go to homepage/i });
    await expect(logoLink).toBeVisible();

    const menuButton = header.getByRole('button', { name: /open navigation menu/i });
    await expect(menuButton).toBeVisible();
    await expect(menuButton).toBeEnabled();

    await expectNoHorizontalOverflow(page);
  });

  test('reveals desktop navigation links at the 768px tablet breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const header = page.getByRole('banner');
    await expect(header).toBeVisible();

    const primaryNav = header.getByRole('navigation', { name: /primary/i });
    await expect(primaryNav).toBeVisible();

    for (const linkName of NAV_LINKS) {
      await expect(primaryNav.getByRole('link', { name: linkName })).toBeVisible();
    }

    const menuButton = header.getByRole('button', { name: /open menu/i });
    await expect(menuButton).toBeHidden();

    await expectNoHorizontalOverflow(page);
  });

  test('maintains layout integrity on a 1280px desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const header = page.getByRole('banner');
    await expect(header).toBeVisible();

    const primaryNav = header.getByRole('navigation', { name: /primary/i });
    await expect(primaryNav).toBeVisible();

    for (const linkName of NAV_LINKS) {
      await expect(primaryNav.getByRole('link', { name: linkName })).toBeVisible();
    }

    await expect(
      page.getByRole('heading', {
        level: 1,
        name: /A Curated Home for Eco-Friendly Digital Nomads/i,
      })
    ).toBeVisible();

    await expectNoHorizontalOverflow(page);
  });
});
