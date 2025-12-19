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
    // Click and wait for either successful navigation or network idle
    await submitLocator.click();
    
    // Wait for navigation with a race between URL change and network idle
    await Promise.race([
      page.waitForURL(/\/(dashboard|account|home|admin)(\/)?(?=$|[?#])/, { timeout: 45000 }),
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 45000 }),
      // Also accept staying on the same page if login was successful (e.g., redirect via JS)
      page.waitForFunction(() => !document.querySelector('[aria-disabled="true"]'), { timeout: 45000 }),
    ]);
  } catch (error) {
    // Capture current URL for debugging
    const currentUrl = page.url();
    
    // Surface any visible error messages to aid debugging
    const errorMessage = await page
      .locator('[role="alert"], .error-message, .alert-error, #form-error, #email-error, #password-error')
      .first()
      .innerText({ timeout: 2000 })
      .then(t => t.trim())
      .catch(() => null);
    
    // Check if we're still on the login page
    const isStillOnLogin = /\/(login|signin|auth)/.test(currentUrl);
    
    // Build detailed error message
    let errorDetails = `Login failed for ${email}`;
    if (errorMessage) {
      errorDetails += `: ${errorMessage}`;
    } else if (isStillOnLogin) {
      errorDetails += '. Still on login page after form submission. Credentials may be invalid or database may not be seeded properly.';
    } else {
      errorDetails += `. Navigation timeout. Current URL: ${currentUrl}`;
    }
    
    throw Object.assign(
      new Error(errorDetails),
      { cause: error }
    );
  }
}
