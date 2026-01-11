/* eslint-disable react-hooks/rules-of-hooks */
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { type Browser, test as base, type Page } from '@playwright/test';
import { type PlaywrightRole, resolveTestUser } from './config/test-users';

export type TestFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
  superAdminPage: Page;
  venueOwnerPage: Page;
};

const ensureStorageDirectory = (filePath?: string) => {
  if (!filePath) return;
  const directory = dirname(filePath);
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
};

const performLogin = async (page: Page, email: string, password: string) => {
  await page.goto('/auth/login');

  const loginForm = page.locator('form');
  const hasLoginForm = (await loginForm.count()) > 0;
  if (!hasLoginForm) return;

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([page.waitForLoadState('networkidle'), page.click('button[type="submit"]')]);

  try {
    await page.waitForTimeout(500);
    await page.waitForURL('**', { waitUntil: 'networkidle', timeout: 5_000 });
  } catch {
    // ignore navigation timeouts – fixtures remain usable even if redirect fails
  }
};

const createAuthenticatedContext = async (
  browser: Browser,
  role: PlaywrightRole
): Promise<{ context: Awaited<ReturnType<Browser['newContext']>>; page: Page }> => {
  const user = resolveTestUser(role);
  const storageState =
    user.storageStatePath && existsSync(user.storageStatePath) ? user.storageStatePath : undefined;

  const context = await browser.newContext({ storageState });
  const page = await context.newPage();

  if (!storageState) {
    await performLogin(page, user.email, user.password);
    if (user.storageStatePath) {
      ensureStorageDirectory(user.storageStatePath);
      await context.storageState({ path: user.storageStatePath });
    }
  }

  return { context, page };
};
const createAuthenticatedPageFixture = (role: PlaywrightRole) => async ({ browser }: { browser: Browser }, use: (page: Page) => Promise<void>) => {
  const { context, page } = await createAuthenticatedContext(browser, role);
  try {
    await use(page);
  } finally {
    await context.close();
  }
};

export const test = base.extend<TestFixtures>({
  adminPage: createAuthenticatedPageFixture('admin'),
  superAdminPage: createAuthenticatedPageFixture('superAdmin'),
  venueOwnerPage: createAuthenticatedPageFixture('venueOwner'),
});

export { expect } from '@playwright/test';
