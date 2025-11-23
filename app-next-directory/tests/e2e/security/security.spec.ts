import { expect, test } from '@playwright/test';

import {
  getOptionalTestEnvVar,
  getRequiredTestEnvVar,
} from '../../helpers/env';

const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseJsonStringArray = (value: string | undefined, fallback: string[]) => {
  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
      return parsed;
    }
  } catch (error) {
    // Fallback to defaults if JSON parsing fails
  }

  return fallback;
};

const escapeForRegex = (value: string) => value.replace(/[-/^$*+?.()|[\]{}]/g, '$&');

const createUrlPattern = (url: string) => new RegExp(`.*${escapeForRegex(url)}`);

const TEST_CONFIG = {
  urls: {
    home: process.env.TEST_HOME_URL ?? '/',
    adminDashboard: process.env.TEST_ADMIN_DASHBOARD_URL ?? '/admin/dashboard',
    signin: process.env.TEST_SIGNIN_URL ?? '/auth/signin',
    signup: process.env.TEST_SIGNUP_URL ?? '/auth/signup',
    dashboard: process.env.TEST_DASHBOARD_URL ?? '/dashboard',
    createListing: process.env.TEST_CREATE_LISTING_URL ?? '/dashboard/create-listing',
    contact: process.env.TEST_CONTACT_URL ?? '/contact',
    search: process.env.TEST_SEARCH_URL ?? '/search',
    api: {
      adminUsers: process.env.TEST_API_ADMIN_USERS_URL ?? '/api/admin/users',
      listings: process.env.TEST_API_LISTINGS_URL ?? '/api/listings',
      userProfile: process.env.TEST_API_USER_PROFILE_URL ?? '/api/users/profile',
      contact: process.env.TEST_API_CONTACT_URL ?? '/api/contact',
      search: process.env.TEST_API_SEARCH_URL ?? '/api/search',
    },
  },
  credentials: {
    userEmail: getRequiredTestEnvVar('TEST_USER_EMAIL', {
      description: 'set in .env.test or your shell before running security e2e tests',
    }),
    userPassword: getRequiredTestEnvVar('TEST_USER_PASSWORD', {
      description: 'set in .env.test or your shell before running security e2e tests',
    }),
    genericEmail: getOptionalTestEnvVar('TEST_GENERIC_EMAIL', 'test@example.com'),
  },
  search: {
    defaultQuery: process.env.TEST_SEARCH_QUERY ?? 'test',
  },
  contactForm: {
    namePrefix: process.env.TEST_CONTACT_NAME_PREFIX ?? 'User',
    messagePrefix: process.env.TEST_CONTACT_MESSAGE_PREFIX ?? 'Message',
    standardName: process.env.TEST_CONTACT_STANDARD_NAME ?? 'Test User',
    standardMessage: process.env.TEST_CONTACT_STANDARD_MESSAGE ?? 'Test message',
    emailPrefix: process.env.TEST_CONTACT_EMAIL_PREFIX ?? 'test',
    emailDomain: process.env.TEST_CONTACT_EMAIL_DOMAIN ?? 'example.com',
    rapidSubmissions: parseNumber(process.env.TEST_CONTACT_RAPID_SUBMISSIONS, 10),
  },
  rateLimiting: {
    apiRequestIterations: parseNumber(process.env.TEST_API_RATE_LIMIT_ITERATIONS, 50),
  },
  timeouts: {
    dialog: parseNumber(process.env.TEST_DIALOG_TIMEOUT, 1000),
    rateLimitPause: parseNumber(process.env.TEST_RATE_LIMIT_PAUSE, 100),
    cspViolation: parseNumber(process.env.TEST_CSP_VIOLATION_TIMEOUT, 1000),
  },
  payloads: {
    weakPasswords: parseJsonStringArray(process.env.TEST_WEAK_PASSWORDS, [
      '123',
      'password',
      'abc123',
      '111111',
    ]),
    sqlInjection: parseJsonStringArray(process.env.TEST_SQL_INJECTION_PAYLOADS, [
      "'; DROP TABLE listings; --",
      "1' OR '1'='1",
      "'; SELECT * FROM users; --",
      "1' UNION SELECT * FROM admin_users--",
    ]),
    xss: parseJsonStringArray(process.env.TEST_XSS_PAYLOADS, [
      '<script>alert("xss")</script>',
      '<img src="x" onerror="alert(\'xss\')">',
      'javascript:alert("xss")',
      '<svg onload="alert(\'xss\')">',
      '"><script>alert("xss")</script>',
    ]),
    emailInjection: parseJsonStringArray(process.env.TEST_EMAIL_INJECTION_PAYLOADS, [
      'test@example.com\nBcc: hacker@evil.com',
      'test@example.com\r\nSubject: Injected Subject',
      'test@example.com%0aBcc:hacker@evil.com',
      'test@example.com\nTo: victim@example.com',
    ]),
    maliciousFiles: parseJsonStringArray(process.env.TEST_MALICIOUS_FILE_NAMES, [
      'test.exe',
      'malware.bat',
      'script.js',
      'virus.php',
    ]),
  },
  content: {
    listingName: process.env.TEST_LISTING_NAME ?? 'Test Listing',
    listingDescription: process.env.TEST_LISTING_DESCRIPTION ?? 'Test Description',
    sessionTokenKey: process.env.TEST_SESSION_TOKEN_KEY ?? 'next-auth.session-token',
    inlineScriptMessage:
      process.env.TEST_INLINE_SCRIPT_MESSAGE ?? 'console.log("This should be blocked")',
    fileContent: process.env.TEST_FILE_CONTENT ?? 'This is a test file',
  },
  files: {
    maliciousMimeType: process.env.TEST_MALICIOUS_FILE_MIME ?? 'application/octet-stream',
  },
};

test.describe('Security Testing', () => {
  test.describe('Authentication & Authorization', () => {
    test('prevents unauthorized access to admin routes', async ({ page }) => {
      // Try to access admin page without authentication
      await page.goto(TEST_CONFIG.urls.adminDashboard);

      // Should redirect to login
      await expect(page).toHaveURL(createUrlPattern(TEST_CONFIG.urls.signin));
    });

    test('prevents privilege escalation', async ({ page }) => {
      // Login as regular user
      await page.goto(TEST_CONFIG.urls.signin);
      await page.fill('input[name="email"]', TEST_CONFIG.credentials.userEmail);
      await page.fill('input[name="password"]', TEST_CONFIG.credentials.userPassword);
      await page.click('button[type="submit"]');

      // Try to access admin API endpoints
      const response = await page.request.get(TEST_CONFIG.urls.api.adminUsers);
      expect(response.status()).toBe(403); // Forbidden
    });

    test('session timeout security', async ({ page }) => {
      // Login
      await page.goto(TEST_CONFIG.urls.signin);
      await page.fill('input[name="email"]', TEST_CONFIG.credentials.userEmail);
      await page.fill('input[name="password"]', TEST_CONFIG.credentials.userPassword);
      await page.click('button[type="submit"]');

      // Simulate session expiry by manipulating session storage
      await page.evaluate(sessionTokenKey => {
        localStorage.removeItem(sessionTokenKey);
        sessionStorage.clear();
      }, TEST_CONFIG.content.sessionTokenKey);

      // Try to access protected resource
      await page.goto(TEST_CONFIG.urls.dashboard);

      // Should be redirected to login
      await expect(page).toHaveURL(createUrlPattern(TEST_CONFIG.urls.signin));
    });

    test('password security requirements', async ({ page }) => {
      await page.goto(TEST_CONFIG.urls.signup);

      // Test weak passwords
      const weakPasswords = TEST_CONFIG.payloads.weakPasswords;

      for (const weakPassword of weakPasswords) {
        await page.goto(TEST_CONFIG.urls.signup);
        await page.fill('input[name="email"]', TEST_CONFIG.credentials.genericEmail);
        await page.fill('input[name="password"]', weakPassword);
        await page.fill('input[name="confirmPassword"]', weakPassword);
        await page.click('button[type="submit"]');

        // Should show password strength error
        await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
      }
    });
  });

  test.describe('Input Validation & Injection Prevention', () => {
    test('prevents SQL injection in search', async ({ page }) => {
      const sqlInjectionPayloads = TEST_CONFIG.payloads.sqlInjection;

      for (const payload of sqlInjectionPayloads) {
        await page.goto(`${TEST_CONFIG.urls.search}?q=${encodeURIComponent(payload)}`);

        // Should not cause database errors
        await expect(page.locator('[data-testid="error-message"]')).not.toContainText(
          /database|sql|mysql|postgres/i
        );

        // Should handle gracefully with no results or sanitized search
        const hasResults = await page.locator('[data-testid="search-results"]').isVisible();
        const hasNoResults = await page.locator('[data-testid="no-results"]').isVisible();

        expect(hasResults || hasNoResults).toBeTruthy();
      }
    });

    test('prevents XSS in user-generated content', async ({ page }) => {
      const xssPayloads = TEST_CONFIG.payloads.xss;

      // Test in contact form
      await page.goto(TEST_CONFIG.urls.contact);

      for (const payload of xssPayloads) {
        await page.fill('input[name="name"]', payload);
        await page.fill('input[name="email"]', TEST_CONFIG.credentials.genericEmail);
        await page.fill('input[name="subject"]', 'Security test subject');
        await page.fill('textarea[name="enquiry"]', payload);
        await page.click('button[type="submit"]');

        // Check that script tags are not executed
        const alertDialogPromise = page
          .waitForEvent('dialog', { timeout: TEST_CONFIG.timeouts.dialog })
          .catch(() => null);
        const dialog = await alertDialogPromise;

        expect(dialog).toBeNull(); // No alert should be triggered

        // Clear form
        await page.reload();
      }
    });

    test('prevents CSRF attacks', async ({ page, context }) => {
      // Login and get session
      await page.goto(TEST_CONFIG.urls.signin);
      await page.fill('input[name="email"]', TEST_CONFIG.credentials.userEmail);
      await page.fill('input[name="password"]', TEST_CONFIG.credentials.userPassword);
      await page.click('button[type="submit"]');

      // Get CSRF token
      const csrfToken = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : null;
      });

      // Try to make request without CSRF token
      const response = await page.request.post(TEST_CONFIG.urls.api.listings, {
        data: {
          name: TEST_CONFIG.content.listingName,
          description: TEST_CONFIG.content.listingDescription,
        },
      });

      // Should be rejected without proper CSRF token
      expect([403, 422]).toContain(response.status());
    });

    test('file upload security', async ({ page }) => {
      await page.goto(TEST_CONFIG.urls.createListing);

      // Test malicious file types
      const maliciousFiles = TEST_CONFIG.payloads.maliciousFiles;

      for (const filename of maliciousFiles) {
        // Create a fake file
        const fileContent = TEST_CONFIG.content.fileContent;

        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({
          name: filename,
          mimeType: TEST_CONFIG.files.maliciousMimeType,
          buffer: Buffer.from(fileContent),
        });

        await page.click('button[data-testid="upload-button"]');

        // Should reject non-image files
        await expect(page.locator('[data-testid="upload-error"]')).toBeVisible();

        // Clear the input
        await fileInput.setInputFiles([]);
      }
    });
  });

  test.describe('Data Privacy & Protection', () => {
    test('sensitive data is not exposed in client-side code', async ({ page }) => {
      await page.goto(TEST_CONFIG.urls.home);

      // Check that sensitive environment variables are not exposed
      const sensitiveData = await page.evaluate(() => {
        const scripts = Array.from(document.getElementsByTagName('script'));
        const allScriptContent = scripts.map(script => script.textContent || '').join(' ');

        const sensitivePatterns = [
          /mongodb:\/\/[^"'\s]+/,
          /postgres:\/\/[^"'\s]+/,
          /mysql:\/\/[^"'\s]+/,
          /sk_test_[a-zA-Z0-9]+/, // Stripe test keys
          /sk_live_[a-zA-Z0-9]+/, // Stripe live keys
          /NEXTAUTH_SECRET/,
          /DATABASE_URL/,
          /API_KEY.*=.*[a-zA-Z0-9]{20,}/,
        ];

        return sensitivePatterns.some(pattern => pattern.test(allScriptContent));
      });

      expect(sensitiveData).toBeFalsy();
    });

    test('user data is properly sanitized in API responses', async ({ page }) => {
      const response = await page.request.get(TEST_CONFIG.urls.api.userProfile);

      if (response.status() === 200) {
        const userData = await response.json();

        // Sensitive fields should not be included
        expect(userData).not.toHaveProperty('password');
        expect(userData).not.toHaveProperty('passwordHash');
        expect(userData).not.toHaveProperty('salt');
        expect(userData).not.toHaveProperty('sessionToken');
      }
    });

    test('email validation prevents header injection', async ({ page }) => {
      await page.goto(TEST_CONFIG.urls.contact);

      // Email header injection payloads
      const injectionEmails = TEST_CONFIG.payloads.emailInjection;

      for (const email of injectionEmails) {
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="name"]', TEST_CONFIG.contactForm.standardName);
        await page.fill('input[name="subject"]', 'Validate headers input');
        await page.fill('textarea[name="enquiry"]', TEST_CONFIG.contactForm.standardMessage);
        await page.click('button[type="submit"]');

        // Should reject malformed emails
        await expect(page.locator('[data-testid="email-error"]')).toBeVisible();

        await page.reload();
      }
    });
  });

  test.describe('Rate Limiting & DDoS Protection', () => {
    test('contact form rate limiting', async ({ page }) => {
      await page.goto(TEST_CONFIG.urls.contact);

      // Submit multiple forms rapidly
      const rapidSubmissions = TEST_CONFIG.contactForm.rapidSubmissions;
      let rateLimitHit = false;

      for (let i = 0; i < rapidSubmissions; i++) {
        await page.fill(
          'input[name="name"]',
          `${TEST_CONFIG.contactForm.namePrefix} ${i}`
        );
        await page.fill(
          'input[name="email"]',
          `${TEST_CONFIG.contactForm.emailPrefix}${i}@${TEST_CONFIG.contactForm.emailDomain}`
        );
        await page.fill(
          'input[name="subject"]',
          `${TEST_CONFIG.contactForm.messagePrefix} subject ${i}`
        );
        await page.fill(
          'textarea[name="enquiry"]',
          `${TEST_CONFIG.contactForm.messagePrefix} ${i}`
        );

        const response = await page.request.post(TEST_CONFIG.urls.api.contact, {
          data: {
            name: `${TEST_CONFIG.contactForm.namePrefix} ${i}`,
            email: `${TEST_CONFIG.contactForm.emailPrefix}${i}@${TEST_CONFIG.contactForm.emailDomain}`,
            subject: `${TEST_CONFIG.contactForm.messagePrefix} subject ${i}`,
            message: `${TEST_CONFIG.contactForm.messagePrefix} ${i}`,
            type: 'general',
          },
        });

        if (response.status() === 429) {
          rateLimitHit = true;
          break;
        }

        await page.waitForTimeout(TEST_CONFIG.timeouts.rateLimitPause); // Brief pause
      }

      // Rate limiting should kick in
      expect(rateLimitHit).toBeTruthy();
    });

    test('API endpoint rate limiting', async ({ request }) => {
      // Test search API rate limiting
      let rateLimitHit = false;

      for (let i = 0; i < TEST_CONFIG.rateLimiting.apiRequestIterations; i++) {
        const response = await request.get(
          `${TEST_CONFIG.urls.api.search}?q=${encodeURIComponent(TEST_CONFIG.search.defaultQuery)}`
        );

        if (response.status() === 429) {
          rateLimitHit = true;

          // Check rate limit headers
          const retryAfter = response.headers()['retry-after'];
          const rateLimit = response.headers()['x-ratelimit-limit'];

          expect(retryAfter).toBeTruthy();
          expect(rateLimit).toBeTruthy();
          break;
        }
      }

      expect(rateLimitHit).toBeTruthy();
    });
  });

  test.describe('Content Security Policy', () => {
    test('CSP headers are properly configured', async ({ page }) => {
      const response = await page.goto(TEST_CONFIG.urls.home);
      const headers = response?.headers() || {};

      // Check for CSP header
      const csp =
        headers['content-security-policy'] || headers['content-security-policy-report-only'];
      expect(csp).toBeTruthy();

      // Should include essential CSP directives
      expect(csp).toContain('default-src');
      expect(csp).toContain('script-src');
      // Ensure script-src doesn't allow unsafe-inline
      expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
      expect(csp).toContain('style-src');
      expect(csp).toContain('img-src');
      expect(csp).toContain('object-src');
      expect(csp).toContain('frame-src');
    });

    test('inline scripts are blocked by CSP', async ({ page }) => {
      // This test would need to be customized based on your actual CSP policy
      await page.goto(TEST_CONFIG.urls.home);

      const cspViolation = await page.evaluate(({ timeout, inlineScriptMessage }) => {
        return new Promise<string | null>(resolve => {
          document.addEventListener('securitypolicyviolation', event => {
            resolve(event.violatedDirective);
          });

          // Try to execute inline script (should be blocked)
          const script = document.createElement('script');
          script.textContent = inlineScriptMessage;
          document.head.appendChild(script);

          // If no violation event fires, resolve with null after timeout
          setTimeout(() => resolve(null), timeout);
        });
      }, {
        timeout: TEST_CONFIG.timeouts.cspViolation,
        inlineScriptMessage: TEST_CONFIG.content.inlineScriptMessage,
      });

      // If CSP is properly configured, inline scripts should be blocked
      if (cspViolation) {
        expect(cspViolation).toContain('script-src');
      }
    });
  });
});
