import type { Page } from '@playwright/test';

export async function loginAs(page: Page, email: string, password: string) {
  // Try common login routes and stop on the first that exposes a recognizable input
  const loginPaths = ['/login', '/auth/login', '/auth/signin', '/signin'];

  // Candidate selectors in preferred order
  const emailSelectors = [
    () => page.getByLabel(/email/i),
    () => page.locator('input[name="email"]'),
    () => page.locator('input[type="email"]'),
    () => page.locator('input[placeholder*="email"]'),
    () => page.locator('input[id*="email"]'),
    () => page.locator('[aria-label*="email"] input'),
  ];

  const passwordSelectors = [
    () => page.getByLabel(/password/i),
    () => page.locator('input[name="password"]'),
    () => page.locator('input[type="password"]'),
    () => page.locator('input[placeholder*="password"]'),
  ];

  let found = false;
  for (const p of loginPaths) {
    await page.goto(p, { waitUntil: 'domcontentloaded' }).catch(() => undefined);
    // quick probe for an email input
    for (const sel of emailSelectors) {
      const locator = sel();
      if ((await locator.count()) > 0 || (await locator.isVisible().catch(() => false))) {
        found = true;
        break;
      }
    }
    if (found) break;
  }

  // Fill credentials using first available locator from the lists
  async function fillFirst(selectors: Array<() => ReturnType<typeof page.locator>>, value: string) {
    for (const sel of selectors) {
      const locator = sel();
      try {
        if ((await locator.count()) === 0) continue;
        await locator.fill(value);
        return true;
      } catch {
        // ignore and try next
      }
    }
    return false;
  }

  const filledEmail = await fillFirst(emailSelectors, email);
  const filledPassword = await fillFirst(passwordSelectors, password);

  const roleSubmit = page.getByRole('button', {
    name: /log in|sign in|sign in with email|continue/i,
  });
  const submitFallback = page.locator('button[type="submit"], button[data-test="submit"]');
  let submitLocator = submitFallback;
  try {
    if ((await roleSubmit.count()) > 0 || (await roleSubmit.isVisible().catch(() => false))) {
      submitLocator = roleSubmit;
    }
  } catch {
    // ignore and use fallback
  }
  await submitLocator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => undefined);

  try {
    // After successful login, the app redirects to the callbackUrl or home page (/)
    // We wait for the URL to change away from login/signin routes
    await Promise.all([
      page.waitForURL(url => {
        const pathname = new URL(url).pathname;
        // Consider login successful if we're no longer on a login/signin page
        return !pathname.includes('/login') && !pathname.includes('/signin');
      }, { timeout: 10000 }),
      submitLocator.click(),
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
