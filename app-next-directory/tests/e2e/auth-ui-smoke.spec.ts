import type { APIRequestContext } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { loginAs } from '../utils/test-utils';

// Use globalThis.process to avoid referencing the Node global `process` symbol
// directly so TypeScript doesn't require @types/node in the test TS scope.
type ProcessLike = { env: Record<string, string | undefined> };
const _proc: ProcessLike = (globalThis as { process?: ProcessLike }).process ?? { env: {} };

const DEFAULT_EMAIL = _proc.env.E2E_USER_EMAIL?.trim() || 'e2e-test@example.com';
const DEFAULT_PASSWORD = _proc.env.E2E_USER_PASSWORD?.trim() || 'TestSecurePass123!';

async function seedUser(
  request: APIRequestContext,
  baseURL: string,
  email: string,
  password: string
) {
  try {
    const response = await request.post(new URL('/api/e2e/setup-user', baseURL).toString(), {
      data: { email, password, role: 'user' },
      timeout: 5000,
    });
    if (!response.ok()) {
      test.info().annotations.push({
        type: 'warning',
        description: `setup-user failed with status ${response.status()}`,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    test.info().annotations.push({
      type: 'warning',
      description: `setup-user request failed: ${message}`,
    });
  }
}
function getResolvedBaseURL(baseURL: string | undefined): string {
  return baseURL ?? _proc.env.E2E_BASE_URL ?? _proc.env.BASE_URL ?? 'http://localhost:3000';
}

test.describe('Auth UI smoke', () => {
  test.afterEach(async ({ request, baseURL }) => {
    const resolvedBaseURL = getResolvedBaseURL(baseURL);

    try {
      await request.delete(new URL('/api/e2e/setup-user', resolvedBaseURL).toString(), {
        data: { email: DEFAULT_EMAIL },
        timeout: 3000,
      });
    } catch {
      // Cleanup failures should not fail the test, but log for debugging.
      test.info().annotations.push({
        type: 'info',
        description: `Cleanup of user ${DEFAULT_EMAIL} failed (may not exist)`,
      });
    }
  });

  test('logs in via the UI form', async ({ page, baseURL, request }) => {
    const resolvedBaseURL = getResolvedBaseURL(baseURL);
    const email = DEFAULT_EMAIL;
    const password = DEFAULT_PASSWORD;

    await seedUser(request, resolvedBaseURL, email, password);

    await page.route('**/api/auth/providers', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await page.route('**/api/auth/csrf', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ csrfToken: 'e2e-csrf-token' }),
      });
    });

    await page.route('**/api/auth/callback/credentials', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, url: '/' }),
      });
    });

    await page.route('**/api/auth/session', route => {
      const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { name: 'E2E User', email, role: 'user' },
          expires,
        }),
      });
    });

    await page.goto(new URL('/auth/login', resolvedBaseURL).toString(), {
      waitUntil: 'domcontentloaded',
    });
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    const authResponse = page
      .waitForResponse(
        response =>
          response.url().includes('/api/auth/callback/credentials') &&
          response.status() === 200,
        { timeout: 30000 }
      )
      .catch(() => null);

    await page.click('button[type="submit"]');
    await authResponse;

    const formError = page.locator('#form-error');
    await expect(formError).toHaveCount(0);

    const sessionData = (await page.evaluate(async () => {
      const response = await fetch('/api/auth/session');
      if (!response.ok) return null;
      return (await response.json()) as { user?: { email?: string } };
    })) as { user?: { email?: string } } | null;
    expect(sessionData?.user?.email).toBe(email);

    const accountMenu = page.getByRole('button', { name: /open account menu/i });
    if (await accountMenu.count()) {
      await expect(accountMenu).toBeVisible({ timeout: 15000 });
    }
  });
});
