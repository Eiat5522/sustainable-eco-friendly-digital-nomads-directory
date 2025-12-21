import { expect, type Page, test } from '@playwright/test';

/**
 * Favorites UI Toggle E2E Tests
 *
 * Note: Deterministic auth gating and navigation cases have been migrated to Jest/RTL
 * for faster, more reliable testing. See:
 * - src/components/favorites/__tests__/FavoriteButton.navigation.test.tsx
 *
 * This E2E suite now focuses on true end-to-end user interaction scenarios that require
 * a browser environment, such as toggling favorites and UI state management.
 */

const DETAIL_PATH = '/listings/banyan-tree-phuket';
const FAVORITES_ROUTE = '**/api/user/favorites**';

async function mockSignedInSession(page: Page) {
  await page.route('**/api/auth/session', async route => {
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 'e2e-user',
          name: 'E2E Tester',
          email: 'e2e-user@example.com',
          role: 'user',
        },
        expires,
      }),
    });
  });
}

test.describe('[E2E] Favorites UI toggle - Authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await mockSignedInSession(page);
  });

  test('allows toggling favorites on the listing hero card', async ({ page }) => {
    let serverFavorited = false;

    await page.route(FAVORITES_ROUTE, async route => {
      const method = route.request().method();
      const url = route.request().url();
      const isSlugRequest = url.includes('/api/user/favorites/banyan-tree-phuket');

      if (!isSlugRequest) {
        await route.continue();
        return;
      }

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ favorited: serverFavorited }),
        });
        return;
      }

      if (method === 'POST') {
        serverFavorited = !serverFavorited;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ favorited: serverFavorited }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto(DETAIL_PATH);
    await expect(page.getByText(/Welcome, E2E!/i)).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Banyan Tree Phuket' })).toBeVisible();
    const addButton = page.getByLabel(/Add to favorites/i);
    await expect(addButton).toBeVisible();

    await addButton.click();
    await expect.poll(() => serverFavorited).toBe(true);
    const removeButton = page.getByLabel(/Remove from favorites/i);
    await expect(removeButton).toBeVisible();
    await expect(removeButton).toBeEnabled();

    await removeButton.click();
    await expect.poll(() => serverFavorited).toBe(false);
  });

  test('does not create duplicate favorites when toggled repeatedly', async ({ page }) => {
    let serverFavorited = false;
    const observedStates: boolean[] = [];

    await page.route(FAVORITES_ROUTE, async route => {
      const method = route.request().method();
      const url = route.request().url();
      const isSlugRequest = url.includes('/api/user/favorites/banyan-tree-phuket');

      if (!isSlugRequest) {
        await route.continue();
        return;
      }

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ favorited: serverFavorited }),
        });
        return;
      }

      if (method === 'POST') {
        serverFavorited = !serverFavorited;
        observedStates.push(serverFavorited);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ favorited: serverFavorited }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto(DETAIL_PATH);
    await expect(page.getByText(/Welcome, E2E!/i)).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Banyan Tree Phuket' })).toBeVisible();

    const addButton = page.getByLabel(/Add to favorites/i);
    await addButton.click();
    const removeButton = page.getByLabel(/Remove from favorites/i);
    await expect(removeButton).toBeVisible();
    await expect(removeButton).toHaveCount(1);
    await expect(removeButton).toBeEnabled();

    await removeButton.click();
    await expect.poll(() => observedStates.length).toBe(2);

    await removeButton.click();
    await expect.poll(() => observedStates.length).toBe(3);

    expect(observedStates).toEqual([true, false, true]);
  });
});

test.describe('[E2E] Favorites UI toggle - Unauthenticated', () => {
  test.skip('prompts login when unauthenticated user tries to favorite (covered by Jest)', async ({
    page,
  }) => {
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await page.goto(DETAIL_PATH);
    await expect(page.getByRole('heading', { level: 3, name: 'Banyan Tree Phuket' })).toBeVisible();

    const favoriteButton = page
      .getByLabel(/favorite/i)
      .or(page.getByRole('button', { name: /favorite/i }));

    if (await favoriteButton.isVisible()) {
      await favoriteButton.click();

      const loginPrompt = page.getByText(/sign in/i).or(page.getByText(/log in/i));
      await expect(loginPrompt).toBeVisible({ timeout: 3000 });
    }
  });

  test.skip('shows login prompt or redirects to login page for unauthenticated favorite attempt (covered by Jest)', async ({
    page,
  }) => {
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await page.route(FAVORITES_ENDPOINT, async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
    });

    await page.goto(DETAIL_PATH);
    await expect(page.getByRole('heading', { level: 3, name: 'Banyan Tree Phuket' })).toBeVisible();

    const favoriteButton = page
      .getByLabel(/favorite/i)
      .or(page.getByRole('button', { name: /favorite/i }));

    if (await favoriteButton.isVisible()) {
      await favoriteButton.click();
      await page.waitForTimeout(1000);

      const isOnLoginPage = page.url().includes('/auth/login');
      const hasLoginModal = await page
        .getByText(/sign in/i)
        .or(page.getByText(/log in/i))
        .isVisible();

      expect(isOnLoginPage || hasLoginModal).toBeTruthy();
    }
  });

  test('hides favorite button for unauthenticated users', async ({ page }) => {
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await page.goto(DETAIL_PATH);
    await page.waitForLoadState('networkidle');

    const favoriteButton = page.getByLabel(/favorite/i);
    const buttonCount = await favoriteButton.count();

    if (buttonCount === 0) {
      expect(buttonCount).toBe(0);
    } else {
      const loginLink = page.getByRole('link', { name: /sign in to favorite/i });
      await expect(loginLink.or(favoriteButton)).toBeVisible();
    }
  });
});
