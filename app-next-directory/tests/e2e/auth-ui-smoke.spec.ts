import type { APIRequestContext } from '@playwright/test';
import { expect, test } from '@playwright/test';

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
