import { expect, test } from '@playwright/test';
import { structuredLogger } from '@/lib/logger';

const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!domain) return '[redacted-email]';
  const visible = local.slice(0, 2) || '*';
  return `${visible}***@${domain}`;
};

const sanitizeAuthResponse = (body: unknown): unknown => {
  if (!body || typeof body !== 'object') return '[redacted]';

  // Deep copy to avoid mutating original and handle nested structures
  // Prefer structuredClone when available (more robust), fall back to JSON for JSON-safe payloads
  let copy: unknown;
  try {
    const structuredCloneFn = globalThis.structuredClone;
    if (typeof structuredCloneFn === 'function') {
      copy = structuredCloneFn(body);
    } else {
      copy = JSON.parse(JSON.stringify(body));
    }
  } catch (_error) {
    return '[redacted-circular-ref]';
  }

  const sensitiveFields = [
    'password',
    'passwordHash',
    'token',
    'refreshToken',
    'sessionToken',
    'accessToken',
  ];

  const redact = (obj: Record<string, unknown> | Array<unknown>): void => {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (item && typeof item === 'object') redact(item as Record<string, unknown>);
      }
      return;
    }

    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (key === 'email' && typeof val === 'string') {
        obj[key] = maskEmail(val);
      } else if (sensitiveFields.includes(key)) {
        obj[key] = '[redacted]';
      } else if (val && typeof val === 'object') {
        redact(val as Record<string, unknown>);
      }
    }
  };

  redact(copy as Record<string, unknown> | Array<unknown>);
  return copy;
};

test.describe('Authentication Debug', () => {
  test('should load login page and have form elements', async ({ page }) => {
    // Go to login page
    await page.goto('/login');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    structuredLogger.debug('Page URL:', { url: page.url() });
    structuredLogger.debug('Page title:', { title: await page.title() });

    // Check if form elements exist
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    const submitButton = page.locator('button[type="submit"]');

    structuredLogger.debug('Email input exists:', { exists: (await emailInput.count()) > 0 });
    structuredLogger.debug('Password input exists:', { exists: (await passwordInput.count()) > 0 });
    structuredLogger.debug('Submit button exists:', { exists: (await submitButton.count()) > 0 });

    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/login-page-debug.png' });

    // Expect form elements to be present
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('should be able to create a user via API', async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: {
        name: 'Debug Test User',
        email: 'debug@example.com',
        password: 'password123',
      },
    });

    const responseBody = await response.json();
    structuredLogger.debug('Registration response status:', { status: response.status() });
    structuredLogger.debug('Registration response body:', {
      body: sanitizeAuthResponse(responseBody),
    });

    // Expect successful creation or user already exists
    expect([201, 409]).toContain(response.status());
  });

  test('should be able to navigate to NextAuth endpoints', async ({ page }) => {
    // Test NextAuth provider page
    await page.goto('/api/auth/providers');

    const content = await page.textContent('body');
    structuredLogger.debug('Auth providers response:', { content });

    // Should return JSON with providers
    expect(content).toBeTruthy();
  });
});
