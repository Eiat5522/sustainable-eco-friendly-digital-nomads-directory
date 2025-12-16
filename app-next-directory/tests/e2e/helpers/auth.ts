import type { Page } from '@playwright/test';

export async function loginAs(page: Page, email: string, password: string) {
  // Try common login routes and stop on the first that exposes a recognizable input
  const loginPaths = ['/auth/login', '/login', '/auth/signin', '/signin'];

  const loginButton = page.getByTestId('login-button').first();
  let found = false;

  for (const p of loginPaths) {
    await page.goto(p, { waitUntil: 'domcontentloaded' }).catch(() => undefined);
    const isLoginPage = await loginButton
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    if (isLoginPage) {
      found = true;
      break;
    }
  }

  if (!found) {
    throw new Error('Login page not found: expected a login form with data-testid="login-button".');
  }

  const form = page.locator('form').filter({ has: loginButton }).first();

  const emailSelectors = [
    () => form.getByLabel('Email', { exact: true }),
    () => form.locator('input[aria-label="Email"]'),
    () => form.locator('input[type="email"]'),
    () => form.locator('input[name="email"]'),
    () => form.locator('input[id*="email"]'),
  ];

  const passwordSelectors = [
    () => form.getByLabel('Password', { exact: true }),
    () => form.locator('input[aria-label="Password"]'),
    () => form.locator('input[type="password"]'),
    () => form.locator('input[name="password"]'),
  ];

  async function fillFirst(selectors: Array<() => ReturnType<typeof page.locator>>, value: string) {
    for (const sel of selectors) {
      const locator = sel();
      try {
        await locator.first().fill(value);
        return;
      } catch {
        // ignore and try next
      }
    }
    throw new Error('Unable to locate login form input.');
  }

  await fillFirst(emailSelectors, email);
  await fillFirst(passwordSelectors, password);

  try {
    // After successful login, the app redirects to the callbackUrl or home page (/)
    // We wait for the URL to change away from login/signin routes
    await Promise.all([
      page.waitForURL(
        url => {
          const pathname = new URL(url).pathname;
          // Consider login successful if we're not on an auth route
          // Check for exact auth routes to avoid false positives
          return !pathname.match(/^\/(auth\/(login|signin)|login|signin)(\/)?$/);
        },
        { timeout: 30000, waitUntil: 'domcontentloaded' }
      ),
      loginButton.click(),
    ]);
  } catch (error) {
    // Surface any visible error messages to aid debugging
    const errorMessage = await page
      .locator('[role="alert"], .error-message, .alert-error')
      .first()
      .innerText({ timeout: 1000 })
      .then(t => t.trim())
      .catch(() => null);
    throw Object.assign(
      new Error(`Login failed${errorMessage ? `: ${errorMessage}` : '. No error message found.'}`),
      { cause: error }
    );
  }
}
