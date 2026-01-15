import type { APIRequestContext } from '@playwright/test';
import { expect, test } from '@playwright/test';

const DEFAULT_EMAIL = process.env.E2E_USER_EMAIL?.trim() || 'e2e-test@example.com';
const DEFAULT_PASSWORD = process.env.E2E_USER_PASSWORD?.trim() || 'TestSecurePass123!';

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

test.describe('Auth UI smoke', () => {
  test('logs in via the UI form', async ({ page, baseURL, request }) => {
    const resolvedBaseURL =
      baseURL ?? process.env.E2E_BASE_URL ?? process.env.BASE_URL ?? 'http://localhost:3000';
    const email = DEFAULT_EMAIL;
    const password = DEFAULT_PASSWORD;

    await seedUser(request, resolvedBaseURL, email, password);

    await page.goto(new URL('/auth/login', resolvedBaseURL).toString(), {
      waitUntil: 'domcontentloaded',
    });
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    await page.waitForURL(url => url.pathname === '/' || url.pathname.startsWith('/dashboard'), {
      timeout: 30000,
    });

    await expect(page.getByRole('button', { name: /open account menu/i })).toBeVisible({
      timeout: 15000,
    });
  });
});
