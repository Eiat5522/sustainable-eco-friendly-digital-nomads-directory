/// <reference types="jest-playwright-preset" />
import type { Page } from 'playwright';

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  // Fill credentials
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  const submit = page.getByRole('button', { name: /log in|sign in/i });
  await submit.waitFor({ state: 'visible' });

  try {
    await Promise.all([
      page.waitForURL(/\/(dashboard|account|home)(\/)?(?=$|[?#])/, { timeout: 10000 }),
      submit.click(),
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
      new Error(
        `Login failed${errorMessage ? `: ${errorMessage}` : '. No error message found.'}`
      ),
      { cause: error }
    );
  }
}
