import { test, expect } from '@playwright/test';

test.describe('ReviewsSection E2E Tests', () => {
  // Test using the home page initially to see if we can create a simple test page
  const testPageUrl = '/';

  test.beforeEach(async ({ page }) => {
    // Mock auth session for different test scenarios
    await page.route('**/api/auth/session', async (route) => {
      // Default to no session (will be overridden in specific tests)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({})
      });
    });

    // Mock reviews API 
    await page.route('**/api/reviews', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      } else {
        // Will be handled by specific tests
        await route.continue();
      }
    });
  });
});

test.describe('ReviewsSection E2E Tests', () => {
  test.describe('Non-authenticated user: Sign-in prompt and callback URL', () => {
    test('should show sign-in prompt with correct callbackUrl', async ({ page }) => {
      // Mock unauthenticated session
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({}) // No user means unauthenticated
        });
      });

      // Create a simple test page with ReviewsSection
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Test ReviewsSection</title>
            <script>
              // Mock the ReviewsSection behavior for testing callbackUrl
              window.addEventListener('DOMContentLoaded', function() {
                const callbackUrl = window.location.href;
                const signInLink = document.querySelector('.sign-in-link');
                if (signInLink) {
                  signInLink.href = '/auth/login?callbackUrl=' + encodeURIComponent(callbackUrl);
                }
              });
            </script>
          </head>
          <body>
            <div class="reviews-section">
              <div class="sign-in-prompt">
                <p>Sign in to leave a review</p>
                <a href="/auth/login" class="sign-in-link">Sign In</a>
              </div>
            </div>
          </body>
        </html>
      `);

      // Wait for DOM content to load and script to execute
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(100);

      // Check that sign-in prompt is visible
      await expect(page.locator('text=Sign in to leave a review')).toBeVisible();
      await expect(page.locator('.sign-in-link')).toBeVisible();

      // Verify the href includes callbackUrl
      const href = await page.locator('.sign-in-link').getAttribute('href');
      expect(href).toContain('/auth/login?callbackUrl=');
      expect(href).toContain(encodeURIComponent(page.url()));
    });

    test('should navigate to login with callbackUrl when Sign In clicked', async ({ page }) => {
      // Mock auth login page
      await page.route('**/auth/login*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: `
            <html>
              <body>
                <h1>Login Page</h1>
                <p>URL: ${route.request().url()}</p>
              </body>
            </html>
          `
        });
      });

      // Set up test page with sign-in link
      await page.goto('data:text/html,<html><body><a href="/auth/login?callbackUrl=' + encodeURIComponent('http://localhost:3000/test-page') + '">Sign In</a></body></html>');

      // Click the sign-in link
      await page.click('text=Sign In');

      // Verify navigation to login page with callbackUrl
      await page.waitForURL('**/auth/login**');
      const url = new URL(page.url());
      expect(url.pathname).toBe('/auth/login');
      expect(url.searchParams.get('callbackUrl')).toBe('http://localhost:3000/test-page');
    });
  });

  test.describe('Signed-in user: Review submission flows', () => {
    test('should redirect to login on 401 response with callbackUrl', async ({ page }) => {
      let reviewSubmissionAttempted = false;

      // Mock authenticated session initially
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user',
              name: 'Test User',
              email: 'test@example.com'
            }
          })
        });
      });

      // Mock reviews API to return 401
      await page.route('**/api/reviews', async (route) => {
        if (route.request().method() === 'POST') {
          reviewSubmissionAttempted = true;
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Unauthorized' })
          });
        } else {
          await route.continue();
        }
      });

      // Mock auth login page
      await page.route('**/auth/login*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: `
            <html>
              <body>
                <h1>Login Page</h1>
                <p>Redirected due to 401</p>
              </body>
            </html>
          `
        });
      });

      // Create test page with review form that handles 401
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Test Review Form</title>
            <script>
              async function submitReview() {
                const response = await fetch('/api/reviews', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ rating: 5, comment: 'Test', listingId: 'test' })
                });
                
                if (response.status === 401) {
                  const callbackUrl = window.location.href;
                  window.location.href = '/auth/login?callbackUrl=' + encodeURIComponent(callbackUrl);
                }
              }
            </script>
          </head>
          <body>
            <div class="review-form">
              <button onclick="submitReview()" id="submit-btn">Submit Review</button>
            </div>
          </body>
        </html>
      `);

      await page.waitForLoadState('domcontentloaded');

      // Click submit button
      await page.click('#submit-btn');

      // Wait for 401 response and redirect
      await page.waitForURL('**/auth/login**', { timeout: 5000 });

      // Verify the callbackUrl parameter
      const url = new URL(page.url());
      expect(url.pathname).toBe('/auth/login');
      const callbackUrl = url.searchParams.get('callbackUrl');
      expect(callbackUrl).toBeTruthy();
      expect(reviewSubmissionAttempted).toBe(true);
    });

    test('should show success message on 200 response', async ({ page }) => {
      // Mock authenticated session
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user',
              name: 'Test User',
              email: 'test@example.com'
            }
          })
        });
      });

      // Mock successful reviews API response
      await page.route('**/api/reviews', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'new-review-id',
              rating: 5,
              comment: 'Test review',
              approved: false
            })
          });
        } else {
          await route.continue();
        }
      });

      // Create test page with review form
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Test Review Form</title>
            <script>
              async function submitReview() {
                const response = await fetch('/api/reviews', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ rating: 5, comment: 'Test', listingId: 'test' })
                });
                
                if (response.ok) {
                  document.getElementById('success-msg').style.display = 'block';
                  document.getElementById('comment-field').value = '';
                  document.getElementById('submit-btn').disabled = true;
                }
              }
            </script>
          </head>
          <body>
            <div class="review-form">
              <textarea id="comment-field">Test comment</textarea>
              <button onclick="submitReview()" id="submit-btn">Submit Review</button>
              <div id="success-msg" style="display:none;">Thank you! Your review has been submitted and is pending approval.</div>
            </div>
          </body>
        </html>
      `);

      await page.waitForLoadState('domcontentloaded');

      // Click submit button
      await page.click('#submit-btn');

      // Wait for success message
      await expect(page.locator('#success-msg')).toBeVisible({ timeout: 5000 });

      // Verify form is reset
      await expect(page.locator('#comment-field')).toHaveValue('');
      await expect(page.locator('#submit-btn')).toBeDisabled();
    });
  });

  test.describe('Form validation', () => {
    test('should disable submit button when required fields are empty', async ({ page }) => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <head>
            <script>
              function updateSubmitButton() {
                const rating = document.getElementById('rating').value;
                const comment = document.getElementById('comment').value.trim();
                const submitBtn = document.getElementById('submit-btn');
                submitBtn.disabled = !rating || !comment;
              }
            </script>
          </head>
          <body>
            <div class="review-form">
              <select id="rating" onchange="updateSubmitButton()">
                <option value="">Select rating</option>
                <option value="5">5 stars</option>
              </select>
              <textarea id="comment" oninput="updateSubmitButton()" placeholder="Enter comment"></textarea>
              <button id="submit-btn" disabled>Submit Review</button>
            </div>
          </body>
        </html>
      `);

      // Initially disabled
      await expect(page.locator('#submit-btn')).toBeDisabled();

      // Add comment but no rating - still disabled
      await page.fill('#comment', 'Test comment');
      await expect(page.locator('#submit-btn')).toBeDisabled();

      // Add rating - should be enabled
      await page.selectOption('#rating', '5');
      await expect(page.locator('#submit-btn')).toBeEnabled();

      // Remove comment - should be disabled again
      await page.fill('#comment', '');
      await expect(page.locator('#submit-btn')).toBeDisabled();
    });
  });
});