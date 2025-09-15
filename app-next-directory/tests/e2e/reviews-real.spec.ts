import { test, expect } from '@playwright/test';

test.describe('ReviewsSection E2E Tests', () => {
  const testPageUrl = '/test-reviews';

  test.beforeEach(async ({ page }) => {
    // Mock auth session API - defaults to unauthenticated
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}) // Empty = unauthenticated
      });
    });

    // Mock reviews API calls
    await page.route('**/api/reviews', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      } else {
        // POST will be handled by specific tests
        await route.continue();
      }
    });

    // Mock any Sanity requests
    await page.route('**/api/sanity/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ result: [] })
      });
    });
  });

  test.describe('Non-authenticated user: Sign-in prompt and callback URL', () => {
    test('should show sign-in prompt with correct callbackUrl', async ({ page }) => {
      await page.goto(testPageUrl);
      await page.waitForLoadState('networkidle');

      // Wait for client-side hydration
      await page.waitForTimeout(2000);

      // Look for the sign-in prompt
      const signInPrompt = page.locator('text=Sign in to leave a review');
      await expect(signInPrompt).toBeVisible({ timeout: 10000 });

      // Find the Sign In button
      const signInButton = page.locator('text=Sign In');
      await expect(signInButton).toBeVisible();

      // Check the href includes callbackUrl
      const href = await signInButton.getAttribute('href');
      expect(href).toBeTruthy();
      
      if (href) {
        expect(href).toContain('/auth/login');
        expect(href).toContain('callbackUrl=');
        expect(href).toContain(encodeURIComponent(testPageUrl));
      }
    });

    test('should navigate to login with callbackUrl when Sign In clicked', async ({ page }) => {
      // Mock the auth login page
      await page.route('**/auth/login*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: `
            <html>
              <body>
                <h1>Login Page</h1>
                <p>Please sign in</p>
                <div data-testid="login-page"></div>
              </body>
            </html>
          `
        });
      });

      await page.goto(testPageUrl);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Click the Sign In button
      const signInButton = page.locator('text=Sign In');
      await expect(signInButton).toBeVisible();
      await signInButton.click();

      // Wait for navigation to login page
      await page.waitForURL('**/auth/login**', { timeout: 10000 });

      // Verify callbackUrl parameter
      const url = new URL(page.url());
      expect(url.pathname).toBe('/auth/login');
      const callbackUrl = url.searchParams.get('callbackUrl');
      expect(callbackUrl).toBeTruthy();
      
      if (callbackUrl) {
        const decodedCallbackUrl = decodeURIComponent(callbackUrl);
        expect(decodedCallbackUrl).toContain(testPageUrl);
      }
    });
  });

  test.describe('Signed-in user: Review submission flows', () => {
    test.beforeEach(async ({ page }) => {
      // Override auth session to simulate signed-in user
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-id',
              name: 'Test User',
              email: 'test@example.com',
              role: 'user'
            }
          })
        });
      });
    });

    test('should redirect to login on 401 response with callbackUrl', async ({ page }) => {
      // Mock reviews API to return 401
      await page.route('**/api/reviews', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Unauthorized' })
          });
        } else {
          await route.continue();
        }
      });

      // Mock auth login page for redirect
      await page.route('**/auth/login*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: `
            <html>
              <body>
                <h1>Login Page</h1>
                <p>Session expired, please sign in again</p>
                <div data-testid="login-redirect"></div>
              </body>
            </html>
          `
        });
      });

      await page.goto(testPageUrl);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Should show review form for signed-in user
      const reviewForm = page.locator('text=Add Your Review');
      await expect(reviewForm).toBeVisible({ timeout: 10000 });

      // Fill the rating (try to click on star rating)
      const starRating = page.locator('[data-testid*="star"], [role="button"]').first();
      if (await starRating.count() > 0) {
        await starRating.click();
      }

      // Fill the comment
      const commentTextarea = page.locator('textarea[placeholder*="Share your experience"], textarea').first();
      await expect(commentTextarea).toBeVisible();
      await commentTextarea.fill('Test review comment');

      // Submit the review
      const submitButton = page.locator('button:has-text("Submit Review")');
      await expect(submitButton).toBeVisible();
      await submitButton.click();

      // Should redirect to login page
      await page.waitForURL('**/auth/login**', { timeout: 10000 });
      
      // Verify callbackUrl parameter
      const url = new URL(page.url());
      const callbackUrl = url.searchParams.get('callbackUrl');
      expect(callbackUrl).toBeTruthy();
      
      if (callbackUrl) {
        const decodedCallbackUrl = decodeURIComponent(callbackUrl);
        expect(decodedCallbackUrl).toContain(testPageUrl);
      }
    });

    test('should show success message on 200 response', async ({ page }) => {
      // Mock successful reviews API response
      await page.route('**/api/reviews', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'new-review-id',
              rating: 5,
              comment: 'Test review comment',
              approved: false
            })
          });
        } else {
          await route.continue();
        }
      });

      await page.goto(testPageUrl);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Find review form
      const reviewForm = page.locator('text=Add Your Review');
      await expect(reviewForm).toBeVisible({ timeout: 10000 });

      // Fill rating
      const starRating = page.locator('[data-testid*="star"], [role="button"]').first();
      if (await starRating.count() > 0) {
        await starRating.click();
      }

      // Fill comment
      const commentTextarea = page.locator('textarea[placeholder*="Share your experience"], textarea').first();
      await commentTextarea.fill('Test review comment');

      // Submit
      const submitButton = page.locator('button:has-text("Submit Review")');
      await submitButton.click();

      // Look for success message
      const successMessage = page.locator('text=Thank you! Your review has been submitted');
      await expect(successMessage).toBeVisible({ timeout: 5000 });

      // Verify form is reset
      await expect(commentTextarea).toHaveValue('');
    });
  });

  test.describe('Form validation', () => {
    test.beforeEach(async ({ page }) => {
      // Mock authenticated session for form testing
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-id',
              name: 'Test User',
              email: 'test@example.com',
              role: 'user'
            }
          })
        });
      });
    });

    test('should disable submit button when required fields are empty', async ({ page }) => {
      await page.goto(testPageUrl);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Find submit button
      const submitButton = page.locator('button:has-text("Submit Review")');
      await expect(submitButton).toBeVisible({ timeout: 10000 });

      // Initially disabled (no rating/comment)
      await expect(submitButton).toBeDisabled();

      // Add comment but no rating - should still be disabled
      const commentTextarea = page.locator('textarea[placeholder*="Share your experience"], textarea').first();
      await commentTextarea.fill('Test comment');
      await expect(submitButton).toBeDisabled();

      // Add rating - should become enabled
      const starRating = page.locator('[data-testid*="star"], [role="button"]').first();
      if (await starRating.count() > 0) {
        await starRating.click();
        await expect(submitButton).toBeEnabled();
      }
    });
  });
});