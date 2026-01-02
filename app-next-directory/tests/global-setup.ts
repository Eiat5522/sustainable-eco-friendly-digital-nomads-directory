import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium, type Page } from '@playwright/test';

/**
 * Global setup for Playwright E2E tests.
 *
 * - Creates `tests/storageStates` directory if missing
 * - Performs UI login for configured roles and saves storageState JSON files
 *
 * Environment variables (optional):
 * - PLAYWRIGHT_BASE_URL: base URL for the running app (defaults to http://localhost:3000)
 * - E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD
 * - E2E_USER_EMAIL / E2E_USER_PASSWORD
 */

async function captureDebugArtifacts(page: Page, prefix: string, storageDir: string) {
  const debugPrefix = path.join(storageDir, prefix);
  try {
    await page.screenshot({ path: `${debugPrefix}.png`, fullPage: true });
    const html = await page.content();
    fs.writeFileSync(`${debugPrefix}.html`, html);
  } catch {
    // ignore debug write errors
  }
}

export default async function globalSetup() {
  const storageDir = path.resolve(process.cwd(), 'tests', 'storageStates');
  if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });

  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

  // Wait for the dev server to be reachable before launching the browser
  async function waitForServer(url: string, timeout = 60_000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        await new Promise<void>((res, rej) => {
          const req = http.get(url, r => {
          // check for successful status codes
          if (r.statusCode && r.statusCode >= 200 && r.statusCode < 400) {
            res();
          } else {
            rej(new Error(`Server returned status ${r.statusCode}`));
          }
            r.resume();
          });
          req.on('error', rej);
          req.setTimeout(3000, () => {
            req.destroy();
            rej(new Error('timeout'));
          });
        });
        return;
      } catch (e) {
        // wait a bit and retry
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    throw new Error(`Server did not become reachable at ${url} within ${timeout}ms`);
  }

  await waitForServer(baseURL);

  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  // Admin credentials
  const adminEmail = process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com';
  const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? 'adminpass123';

  try {
    // Navigate and perform login - adjust selectors if your app differs
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="password"]', adminPassword);
    await page.click('button[type="submit"]');

    // Wait for a stable post-login URL or element (longer timeout + debug capture)
    try {
      await page.waitForURL('**/admin**', { timeout: 60_000 });
    } catch (err) {
      // capture debug artifacts to help diagnose flakiness
      await captureDebugArtifacts(page, 'debug-admin', storageDir);
      throw err;
    }

    // Save admin storage state
    const adminPath = path.join(storageDir, 'admin.json');
    await context.storageState({ path: adminPath });
  } catch (err) {
    // don't fail global setup hard; surface the error to logs

    console.warn('global-setup: failed to generate admin storageState', err);
  }

  // Also create a regular user storage state if credentials are present
  const userEmail = process.env.E2E_USER_EMAIL ?? 'test_customer@example.com';
  const userPassword = process.env.E2E_USER_PASSWORD ?? 'password';

  try {
    const userContext = await browser.newContext({ baseURL });
    try {
      const userPage = await userContext.newPage();
      await userPage.goto('/auth/login');
      await userPage.fill('input[name="email"]', userEmail);
      await userPage.fill('input[name="password"]', userPassword);
      await userPage.click('button[type="submit"]');
      try {
        await userPage.waitForURL('**/dashboard**', { timeout: 60_000 });
      } catch (err) {
        await captureDebugArtifacts(userPage, 'debug-user', storageDir);
        throw err;
      }
      const userPath = path.join(storageDir, 'user.json');
      await userContext.storageState({ path: userPath });
    } finally {
      await userContext.close();
    }
  } catch (err) {
    console.warn('global-setup: failed to generate user storageState', err);
  }
  await context.close();
  await browser.close();
}
