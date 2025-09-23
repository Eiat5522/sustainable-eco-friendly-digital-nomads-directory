import { expect, test, type Page } from '@playwright/test';

const DETAIL_PATH = '/listings/banyan-tree-phuket';
const FAVORITES_ENDPOINT = '**/api/user/favorites/banyan-tree-phuket';

async function mockSignedInSession(page: Page) {
  await page.route('**/api/auth/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: { id: 'e2e-user', name: 'E2E Tester' } }),
    });
  });
}

test.describe('[E2E] Favorites UI toggle', () => {
  test.beforeEach(async ({ page }) => {
    await mockSignedInSession(page);
  });

  test('allows toggling favorites on the listing hero card', async ({ page }) => {
    let serverFavorited = false;

    await page.route(FAVORITES_ENDPOINT, async (route) => {
      if (route.request().method() === 'POST') {
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
    await expect(page.getByRole('heading', { level: 3, name: 'Banyan Tree Phuket' })).toBeVisible();
    const addButton = page.getByLabel(/Add to favorites/i);
    await expect(addButton).toBeVisible();

    await addButton.click();
    const removeButton = page.getByLabel(/Remove from favorites/i);
    await expect(removeButton).toBeVisible();

    await removeButton.click();
    await expect(page.getByLabel(/Add to favorites/i)).toBeVisible();
  });

  test('does not create duplicate favorites when toggled repeatedly', async ({ page }) => {
    let serverFavorited = false;
    const observedStates: boolean[] = [];

    await page.route(FAVORITES_ENDPOINT, async (route) => {
      if (route.request().method() === 'POST') {
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
    await expect(page.getByRole('heading', { level: 3, name: 'Banyan Tree Phuket' })).toBeVisible();

    const addButton = page.getByLabel(/Add to favorites/i);
    await addButton.click();
    const removeButton = page.getByLabel(/Remove from favorites/i);
    await expect(removeButton).toBeVisible();
    await expect(removeButton).toHaveCount(1);

    await removeButton.click();
    const addAgainButton = page.getByLabel(/Add to favorites/i);
    await expect(addAgainButton).toBeVisible();

    await addAgainButton.click();
    await expect(page.getByLabel(/Remove from favorites/i)).toHaveCount(1);

    expect(observedStates).toEqual([true, false, true]);
  });
});
