/** biome-ignore-all lint/suspicious/noConsole: false positive */
/**
 * Test utilities for E2E testing
 */

import type { Page } from '@playwright/test';
import type { Role } from '@/models/User';

const maskEmail = (email: string): string => {
  const parts = email.split('@');
  if (parts.length !== 2) return '[redacted-email]';
  const [local = '', domain] = parts;
  if (!domain) return '[redacted-email]';
  const visible = local.length > 0 ? local[0] : '*';
  return `${visible}***@${domain}`;
};

/**
 * Login as a specific role in E2E test environment
 * This function simulates authentication by creating/finding a test user
 * and setting up the session for E2E testing
 */
export async function loginAsRole(page: Page, role: Role): Promise<void> {
  const isE2E = process.env.E2E === '1' || process.env.NEXT_PUBLIC_E2E === '1';

  if (!isE2E) {
    console.warn('loginAsRole should only be used in E2E test environment');
    return;
  }

  try {
    // Map roles to test user emails
    const roleEmailMap: Record<Role, string> = {
      user: process.env.E2E_USER_EMAIL ?? 'user@example.com',
      editor: process.env.E2E_EDITOR_EMAIL ?? 'editor@example.com',
      venueOwner: process.env.E2E_VENUE_OWNER_EMAIL ?? 'venue@example.com',
      admin: process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com',
      superAdmin: process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com', // Use admin email for superAdmin
    };

    const email = roleEmailMap[role];
    const password = process.env.E2E_USER_PASSWORD ?? 'TestSecurePass123!';

    // First, try to create or ensure the test user exists via API
    await ensureTestUserExists(email, password, role);

    // Navigate to login page if not already there
    if (!page.url().includes('/login') && !page.url().includes('/auth/login')) {
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
    }

    // Fill login form
    await fillLoginForm(page, email, password);

    // Submit and wait for authentication
    await submitLogin(page);

    // Wait for successful navigation (should redirect to dashboard or home)
    await Promise.race([
      page.waitForURL(/\/(dashboard|admin|home)(\/)?(?=$|[?#])/, { timeout: 10000 }),
      page.waitForNavigation({ timeout: 10000 }),
      // Wait for a successful login indicator
      page.waitForFunction(
        () => {
          const userMenu = document.querySelector<HTMLElement>(
            '[data-testid="user-menu"], [aria-label*="user"], .user-menu'
          );
          const loginButton = document.querySelector(
            '[data-testid="login-button"], [aria-label*="login"]'
          );
          // If user menu exists or login button is gone, we likely logged in
          return (userMenu && userMenu.offsetParent !== null) || !loginButton;
        },
        { timeout: 10000 }
      ),
    ]);

    console.log(`Successfully authenticated as ${role} (${maskEmail(email)})`);
  } catch (error) {
    console.error(`Failed to login as ${role}:`, error);
    throw new Error(
      `Authentication failed for role ${role}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Ensure test user exists by calling the API
 */
async function ensureTestUserExists(email: string, password: string, role: Role): Promise<void> {
  try {
    const response = await fetch(
      `${process.env.E2E_BASE_URL ?? process.env.BASE_URL ?? 'http://localhost:3000'}/api/e2e/setup-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      }
    );

    if (!response.ok) {
      // If the endpoint doesn't exist, we'll try direct database creation
      console.warn(`User setup API failed (${response.status}), will try alternative method`);
    }
  } catch (error) {
    // API might not exist, that's okay - we'll handle it in the login flow
    console.warn('User setup API not available:', error);
  }
}

/**
 * Fill login form with credentials
 */
async function fillLoginForm(page: Page, email: string, password: string): Promise<void> {
  // Try to find email field
  const emailField =
    page.getByLabel(/email/i) ||
    page.locator('input[name="email"]').first() ||
    page.locator('input[type="email"]').first();

  await emailField.waitFor({ state: 'visible', timeout: 5000 });
  await emailField.fill(email);

  // Try to find password field
  const passwordField =
    page.getByLabel(/password/i) ||
    page.locator('input[name="password"]').first() ||
    page.locator('input[type="password"]').first();

  await passwordField.waitFor({ state: 'visible', timeout: 5000 });
  await passwordField.fill(password);
}

/**
 * Submit login form
 */
async function submitLogin(page: Page): Promise<void> {
  // Try multiple submit button selectors
  const submitSelectors = [
    () => page.getByRole('button', { name: /log in|sign in|sign in with email|continue/i }),
    () => page.locator('button[type="submit"]').first(),
    () => page.locator('button[data-test="submit"]').first(),
    () => page.locator('form button').last(),
  ];

  let submitButton = null;
  for (const selector of submitSelectors) {
    try {
      const button = selector();
      if (await button.isVisible({ timeout: 1000 })) {
        submitButton = button;
        break;
      }
    } catch {
      // Continue to next selector
    }
  }

  if (!submitButton) {
    throw new Error('Could not find login submit button');
  }

  await submitButton.click();
}
