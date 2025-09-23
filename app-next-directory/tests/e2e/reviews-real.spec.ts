import { test, expect, type Page } from '@playwright/test';

const SIGNED_IN_TEST_PAGE = '/test-reviews?signedIn=1';

async function prepareSignedInPage(page: Page) {
  await page.goto(SIGNED_IN_TEST_PAGE);
  await page.waitForSelector('[data-testid="submit-review-button"]', { state: 'visible' });
}

test.describe('Reviews submission flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: { id: 'e2e-user', name: 'E2E Tester', email: 'tester@example.com' } })
      });
    });
  });

  test('authenticated user submits review and sees pending confirmation card', async ({ page }) => {
    await page.route('**/api/reviews', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'review-e2e-pending',
            rating: 5,
            comment: 'Amazing eco-friendly stay with great community vibes.',
            approved: false,
            createdAt: '2024-06-01T12:00:00Z'
          })
        });
        return;
      }

      await route.continue();
    });

    await prepareSignedInPage(page);

    await page.click('[data-testid="rating-star-5"]');
    await page.fill('[data-testid="review-comment-field"]', 'Amazing eco-friendly stay with great community vibes.');
    await page.click('[data-testid="submit-review-button"]');

    await expect(page.getByTestId('review-success-message')).toBeVisible();
    const status = page.getByTestId('submitted-review-status');
    await expect(status).toHaveText(/pending approval/i);
    await expect(page.getByTestId('submitted-review-comment')).toContainText('Amazing eco-friendly stay');
  });

  test('shows approved status when backend marks review as approved', async ({ page }) => {
    await page.route('**/api/reviews', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'review-e2e-approved',
            rating: 4,
            comment: 'Approved review from moderators.',
            approved: true,
            createdAt: '2024-06-15T09:30:00Z'
          })
        });
        return;
      }

      await route.continue();
    });

    await prepareSignedInPage(page);

    await page.click('[data-testid="rating-star-4"]');
    await page.fill('[data-testid="review-comment-field"]', 'Approved review from moderators.');
    await page.click('[data-testid="submit-review-button"]');

    await expect(page.getByTestId('review-success-message')).toBeVisible();
    await expect(page.getByTestId('submitted-review-status')).toHaveText(/approved/i);
  });

  test('prevents submission until both rating and comment are provided', async ({ page }) => {
    await prepareSignedInPage(page);

    const submitButton = page.getByTestId('submit-review-button');
    await expect(submitButton).toBeDisabled();

    await page.click('[data-testid="rating-star-4"]');
    await expect(submitButton).toBeDisabled();

    await page.fill('[data-testid="review-comment-field"]', 'Quick thoughts');
    await expect(submitButton).toBeEnabled();

    await page.fill('[data-testid="review-comment-field"]', '');
    await expect(submitButton).toBeDisabled();
  });

  test('displays server validation error when comment is too short', async ({ page }) => {
    await page.route('**/api/reviews', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Comment must be at least 20 characters.' })
        });
        return;
      }

      await route.continue();
    });

    await prepareSignedInPage(page);

    await page.click('[data-testid="rating-star-3"]');
    await page.fill('[data-testid="review-comment-field"]', 'Too short');
    await page.click('[data-testid="submit-review-button"]');

    const errorMessage = page.getByTestId('review-error-message');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText('Comment must be at least 20 characters.');
  });
});
