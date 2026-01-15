/** biome-ignore-all lint/suspicious/noConsole: false positive */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium, type Page } from '@playwright/test';
import type { Role } from '../src/models/User';
import { loginAs } from './utils/test-utils';

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

const DEFAULT_E2E_PASSWORD = process.env.E2E_DEFAULT_PASSWORD?.trim() || 'TestSecurePass123!';
const parseEnvFlag = (value: string | undefined, defaultValue: boolean) => {
  if (value == null) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return defaultValue;
};

async function seedE2EUser(
  baseURL: string,
  { email, password, role }: { email: string; password: string; role: Role }
) {
  const endpoint = new URL('/api/e2e/setup-user', baseURL).toString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn(`global-setup: failed to seed ${role} user (status ${response.status})`);
    }
  } catch (error) {
    console.warn(`global-setup: failed to seed ${role} user`, error);
  } finally {
    clearTimeout(timeout);
  }
}

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
      // log the failure, wait a bit and retry
      console.debug('waitForServer attempt failed:', e);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error(`Server did not become reachable at ${url} within ${timeout}ms`);
}

export default async function globalSetup() {
  const storageDir = path.resolve(process.cwd(), 'tests', 'storageStates');
  if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });

  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
  const allowTokenFallback = parseEnvFlag(process.env.E2E_ALLOW_TOKEN_FALLBACK, true);
  const failOnUiLoginFailure = parseEnvFlag(process.env.E2E_FAIL_ON_UI_LOGIN_FAILURE, false);

  // Resolve credentials with defaults before allocating resources
  const adminPassword = process.env.E2E_ADMIN_PASSWORD?.trim() || DEFAULT_E2E_PASSWORD;
  const userPassword = process.env.E2E_USER_PASSWORD?.trim() || DEFAULT_E2E_PASSWORD;

  await waitForServer(baseURL);

  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  // Admin credentials
  const adminEmail = process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com';

  try {
    await seedE2EUser(baseURL, {
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });
    // Navigate and perform login - adjust selectors if your app differs
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="password"]', adminPassword);
    await page.click('button[type="submit"]');

    // Wait for a stable post-login URL or element (longer timeout + debug capture)
    try {
      // Wait for navigation to dashboard, admin, or home
      await page.waitForURL(
        url =>
          url.pathname.includes('/admin') ||
          url.pathname.includes('/dashboard') ||
          url.pathname === '/',
        { timeout: 30000 }
      );
    } catch (err: unknown) {
      // capture debug artifacts to help diagnose flakiness, then rethrow
      await captureDebugArtifacts(page, 'debug-admin', storageDir);
      if (err instanceof Error) throw err;
      throw new Error(String(err));
    }

    // Save admin storage state
    const adminPath = path.join(storageDir, 'admin.json');
    await context.storageState({ path: adminPath });
  } catch (err) {
    // don't fail global setup hard; surface the error to logs
    console.warn('global-setup: failed to generate admin storageState', err);
    if (failOnUiLoginFailure) {
      throw err;
    }
    if (!allowTokenFallback) {
      console.warn('global-setup: token fallback disabled via E2E_ALLOW_TOKEN_FALLBACK');
    } else {
      try {
        const adminPath = path.join(storageDir, 'admin.json');
        await loginAs(page, 'admin', { redirectTo: '/admin' });
        await context.storageState({ path: adminPath });
      } catch (fallbackError) {
        console.warn(
          'global-setup: failed to generate admin storageState via token fallback',
          fallbackError
        );
      }
    }
  }

  // Also create a regular user storage state; require credentials in env
  const userEmail = process.env.E2E_USER_EMAIL ?? 'e2e-test@example.com';

  try {
    const userContext = await browser.newContext({ baseURL });
    try {
      const userPage = await userContext.newPage();
      await seedE2EUser(baseURL, {
        email: userEmail,
        password: userPassword,
        role: 'user',
      });
      await userPage.goto('/auth/login');
      await userPage.fill('input[name="email"]', userEmail);
      await userPage.fill('input[name="password"]', userPassword);
      await userPage.click('button[type="submit"]');
      try {
        await userPage.waitForURL(
          url => url.pathname.includes('/dashboard') || url.pathname === '/',
          { timeout: 30000 }
        );
      } catch (err: unknown) {
        await captureDebugArtifacts(userPage, 'debug-user', storageDir);
        if (err instanceof Error) throw err;
        throw new Error(String(err));
      }
      const userPath = path.join(storageDir, 'user.json');
      await userContext.storageState({ path: userPath });
    } finally {
      await userContext.close();
    }
  } catch (err) {
    console.warn('global-setup: failed to generate user storageState', err);
    if (failOnUiLoginFailure) {
      throw err;
    }
    if (!allowTokenFallback) {
      console.warn('global-setup: token fallback disabled via E2E_ALLOW_TOKEN_FALLBACK');
    } else {
      try {
        const userContext = await browser.newContext({ baseURL });
        try {
          const userPage = await userContext.newPage();
          const userPath = path.join(storageDir, 'user.json');
          await loginAs(userPage, 'user', { redirectTo: '/dashboard' });
          await userContext.storageState({ path: userPath });
        } finally {
          await userContext.close();
        }
      } catch (fallbackError) {
        console.warn(
          'global-setup: failed to generate user storageState via token fallback',
          fallbackError
        );
      }
    }
  }
  await context.close();
  await browser.close();
}
