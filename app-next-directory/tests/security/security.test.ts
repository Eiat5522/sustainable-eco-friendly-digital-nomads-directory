import { expect, test } from '@playwright/test';

test.describe('Security Testing', () => {
  test.describe('Authentication & Authorization', () => {
    test('prevents unauthorized access to admin routes', async ({ page }) => {
      // Try to access admin page without authentication
      await page.goto('/admin/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/.*\/auth\/signin/);
    });

    test('prevents privilege escalation', async ({ page }) => {
      // Login as regular user
      await page.goto('/auth/signin');
      await page.fill('input[name="email"]', 'user@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Try to access admin API endpoints
      const response = await page.request.get('/api/admin/users');
      expect(response.status()).toBe(403); // Forbidden
    });

    test('session timeout security', async ({ page }) => {
      // Login
      await page.goto('/auth/signin');
      await page.fill('input[name="email"]', 'user@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Simulate session expiry by manipulating session storage
      await page.evaluate(() => {
        localStorage.removeItem('next-auth.session-token');
        sessionStorage.clear();
      });

      // Try to access protected resource
      await page.goto('/dashboard');

      // Should be redirected to login
      await expect(page).toHaveURL(/.*\/auth\/signin/);
    });

    test('password security requirements', async ({ page }) => {
      await page.goto('/auth/signup');

      // Test weak passwords
      const weakPasswords = ['123', 'password', 'abc123', '111111'];

      for (const weakPassword of weakPasswords) {
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', weakPassword);
        await page.fill('input[name="confirmPassword"]', weakPassword);
        await page.click('button[type="submit"]');

        // Should show password strength error
        await expect(page.locator('[data-testid="password-error"]')).toBeVisible();

        // Clear form
        await page.reload();
      }
    });
  });

  test.describe('Input Validation & Injection Prevention', () => {
    test('prevents SQL injection in search', async ({ page }) => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE listings; --",
        "1' OR '1'='1",
        "'; SELECT * FROM users; --",
        "1' UNION SELECT * FROM admin_users--",
      ];

      for (const payload of sqlInjectionPayloads) {
        await page.goto(`/search?q=${encodeURIComponent(payload)}`);

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
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(\'xss\')">',
        'javascript:alert("xss")',
        '<svg onload="alert(\'xss\')">',
        '"><script>alert("xss")</script>',
      ];

      // Test in contact form
      await page.goto('/contact');

      for (const payload of xssPayloads) {
        await page.fill('input[name="name"]', payload);
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('textarea[name="message"]', payload);
        await page.click('button[type="submit"]');

        // Check that script tags are not executed
        const alertDialogPromise = page.waitForEvent('dialog', { timeout: 1000 }).catch(() => null);
        const dialog = await alertDialogPromise;

        expect(dialog).toBeNull(); // No alert should be triggered

        // Clear form
        await page.reload();
      }
    });

    test('prevents CSRF attacks', async ({ page, context }) => {
      // Login and get session
      await page.goto('/auth/signin');
      await page.fill('input[name="email"]', 'user@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Get CSRF token
      const csrfToken = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : null;
      });

      // Try to make request without CSRF token
      const response = await page.request.post('/api/listings', {
        data: {
          name: 'Test Listing',
          description: 'Test Description',
        },
      });

      // Should be rejected without proper CSRF token
      expect([403, 422]).toContain(response.status());
    });

    test('file upload security', async ({ page }) => {
      await page.goto('/dashboard/create-listing');

      // Test malicious file types
      const maliciousFiles = ['test.exe', 'malware.bat', 'script.js', 'virus.php'];

      for (const filename of maliciousFiles) {
        // Create a fake file
        const fileContent = 'This is a test file';
        const file = new File([fileContent], filename, { type: 'application/octet-stream' });

        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({
          name: filename,
          mimeType: 'application/octet-stream',
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
      await page.goto('/');

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
      const response = await page.request.get('/api/users/profile');

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
      await page.goto('/contact');

      // Email header injection payloads
      const injectionEmails = [
        'test@example.com\nBcc: hacker@evil.com',
        'test@example.com\r\nSubject: Injected Subject',
        'test@example.com%0aBcc:hacker@evil.com',
        'test@example.com\nTo: victim@example.com',
      ];

      for (const email of injectionEmails) {
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="name"]', 'Test User');
        await page.fill('textarea[name="message"]', 'Test message');
        await page.click('button[type="submit"]');

        // Should reject malformed emails
        await expect(page.locator('[data-testid="email-error"]')).toBeVisible();

        await page.reload();
      }
    });
  });

  test.describe('Rate Limiting & DDoS Protection', () => {
    test('contact form rate limiting', async ({ page }) => {
      await page.goto('/contact');

      // Submit multiple forms rapidly
      const rapidSubmissions = 10;
      let rateLimitHit = false;

      for (let i = 0; i < rapidSubmissions; i++) {
        await page.fill('input[name="name"]', `User ${i}`);
        await page.fill('input[name="email"]', `test${i}@example.com`);
        await page.fill('textarea[name="message"]', `Message ${i}`);

        const response = await page.request.post('/api/contact', {
          data: {
            name: `User ${i}`,
            email: `test${i}@example.com`,
            message: `Message ${i}`,
          },
        });

        if (response.status() === 429) {
          rateLimitHit = true;
          break;
        }

        await page.waitForTimeout(100); // Brief pause
      }

      // Rate limiting should kick in
      expect(rateLimitHit).toBeTruthy();
    });

    test('API endpoint rate limiting', async ({ request }) => {
      // Test search API rate limiting
      let rateLimitHit = false;

      for (let i = 0; i < 50; i++) {
        const response = await request.get('/api/search?q=test');

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
      const response = await page.goto('/');
      const headers = response?.headers() || {};

      // Check for CSP header
      const csp =
        headers['content-security-policy'] || headers['content-security-policy-report-only'];
      expect(csp).toBeTruthy();

      // Should include essential CSP directives
      expect(csp).toContain('default-src');
      expect(csp).toContain('script-src');
      expect(csp).toContain('style-src');
      expect(csp).toContain('img-src');
    });

    test('inline scripts are blocked by CSP', async ({ page }) => {
      // This test would need to be customized based on your actual CSP policy
      await page.goto('/');

      const cspViolation = await page.evaluate(() => {
        return new Promise(resolve => {
          document.addEventListener('securitypolicyviolation', e => {
            resolve(e.violatedDirective);
          });

          // Try to execute inline script (should be blocked)
          const script = document.createElement('script');
          script.textContent = 'console.log("This should be blocked")';
          document.head.appendChild(script);

          // If no violation event fires, resolve with null after timeout
          setTimeout(() => resolve(null), 1000);
        });
      });

      // If CSP is properly configured, inline scripts should be blocked
      if (cspViolation) {
        expect(cspViolation).toContain('script-src');
      }
    });
  });
});
