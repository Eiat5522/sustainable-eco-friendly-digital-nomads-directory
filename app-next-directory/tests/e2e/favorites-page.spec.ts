import { expect, type Page, test } from '@playwright/test';

const FAVORITES_PAGE = '/favorites';
const LISTINGS_PAGE = '/listings';

const MOCK_USER = {
  id: 'test-user-123',
  name: 'Test User',
  email: 'test@example.com',
};

const MOCK_FAVORITE_LISTINGS = [
  {
    id: 'listing-1',
    slug: 'banyan-tree-phuket',
    name: 'Banyan Tree Phuket',
    description: 'Luxury eco-resort with sustainability focus',
    imageUrl: '/images/banyan-tree.jpg',
    city: 'Phuket',
    country: 'Thailand',
    category: 'Accommodation',
    ecoFocusTags: ['Solar Powered', 'Zero Waste'],
    sustainabilityScore: 95,
  },
  {
    id: 'listing-2',
    slug: 'green-hub-coworking',
    name: 'Green Hub Coworking',
    description: 'Sustainable coworking space',
    imageUrl: '/images/green-hub.jpg',
    city: 'Lisbon',
    country: 'Portugal',
    category: 'Coworking',
    ecoFocusTags: ['Recycling Program', 'Green Building'],
    sustainabilityScore: 90,
  },
];

async function mockAuthenticatedSession(page: Page) {
  await page.route('**/api/auth/session', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: MOCK_USER }),
    });
  });
}

async function mockFavoritesAPI(page: Page, listings = MOCK_FAVORITE_LISTINGS) {
  await page.route('**/api/user/favorites', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ favorites: listings }),
      });
    } else {
      await route.continue();
    }
  });
}

test.describe('[E2E] Favorites Page', () => {
  test('displays favorited listings for authenticated user', async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockFavoritesAPI(page);

    await page.goto(FAVORITES_PAGE);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /my favorites/i })).toBeVisible();

    for (const listing of MOCK_FAVORITE_LISTINGS) {
      const listingCard = page.getByText(listing.name);
      await expect(listingCard).toBeVisible();
    }

    const banyanTree = page.getByText('Banyan Tree Phuket');
    await expect(banyanTree).toBeVisible();

    const greenHub = page.getByText('Green Hub Coworking');
    await expect(greenHub).toBeVisible();
  });

  test('shows empty state when no favorites exist', async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockFavoritesAPI(page, []);

    await page.goto(FAVORITES_PAGE);
    await page.waitForLoadState('networkidle');

    const emptyMessage = page
      .getByText(/no favorites yet/i)
      .or(page.getByText(/you haven't saved any/i));
    await expect(emptyMessage).toBeVisible();

    const browseLink = page
      .getByRole('link', { name: /browse listings/i })
      .or(page.getByRole('link', { name: /explore/i }));
    await expect(browseLink).toBeVisible();
  });

  test('allows navigation to listing detail from favorites page', async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockFavoritesAPI(page);

    await page.goto(FAVORITES_PAGE);
    await page.waitForLoadState('networkidle');

    const listingLink = page.getByRole('link', { name: /banyan tree phuket/i }).first();
    await expect(listingLink).toBeVisible();

    await listingLink.click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/listings\/banyan-tree-phuket/);
  });

  test('allows removing a favorite from the favorites page', async ({ page }) => {
    let favorites = [...MOCK_FAVORITE_LISTINGS];

    await mockAuthenticatedSession(page);

    await page.route('**/api/user/favorites**', async route => {
      const method = route.request().method();

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ favorites }),
        });
      } else if (method === 'POST' || method === 'DELETE') {
        const url = route.request().url();
        if (url.includes('banyan-tree-phuket')) {
          favorites = favorites.filter(f => f.slug !== 'banyan-tree-phuket');
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ favorited: false }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(FAVORITES_PAGE);
    await page.waitForLoadState('networkidle');

    const removeButton = page.getByLabel(/remove.*banyan tree/i).first();
    await expect(removeButton).toBeVisible();

    await removeButton.click();
    await page.waitForTimeout(500);

    const banyanTree = page.getByText('Banyan Tree Phuket');
    await expect(banyanTree).not.toBeVisible();

    const greenHub = page.getByText('Green Hub Coworking');
    await expect(greenHub).toBeVisible();
  });

  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await page.goto(FAVORITES_PAGE);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('displays favorites count in page heading', async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockFavoritesAPI(page);

    await page.goto(FAVORITES_PAGE);
    await page.waitForLoadState('networkidle');

    const countIndicator = page.getByText(/2/).or(page.getByText(/2 favorites/i));
    await expect(countIndicator).toBeVisible();
  });
});
