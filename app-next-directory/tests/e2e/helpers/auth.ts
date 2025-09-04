/// <reference types="jest-playwright-preset" />

// Uses the global 'page' from jest-playwright; no Page param needed
export async function loginAs(email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  const submit = page.locator('button[type="submit"]');
  await submit.waitFor({ state: 'visible' });
  await Promise.all([
    page.waitForURL(/\/(dashboard|account|home)(\/)?$/, { timeout: 10000 }),
    submit.click(),
  ]);
}
