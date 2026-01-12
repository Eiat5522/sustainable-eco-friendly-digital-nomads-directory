import { expect, test } from '@playwright/test';
import { getSessionForRole } from '@tests/helpers/test-data';
import { loginAs, TestHelpers } from '../utils/test-utils';

test.describe('Listing Management E2E', () => {
  // Test Data Management
  const testData = {
    listing: {
      name: 'Test Eco Coworking',
      shortDescription: 'Sustainable workspace in the heart of Bangkok',
      longDescription:
        'A sustainable workspace in the heart of Bangkok with natural lighting and quiet zones.',
      type: 'coworking',
      city: 'Bangkok',
      address: '123 Green Street',
    },
  };

  // Role-Based Access Tests
  test.describe('role-based access control', () => {
    test('regular user cannot access admin features', async ({ page }) => {
      await loginAs(page, 'user');

      // Try to access admin routes
      await page.goto('/admin', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForURL(/\/unauthorized/, { timeout: 15000 });
      await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();
      expect(page.url()).toContain('/unauthorized');

      await page
        .goto('/admin/listings', { waitUntil: 'domcontentloaded', timeout: 15000 })
        .catch(() => {});
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      await page
        .waitForURL(/\/unauthorized/, { timeout: 15000, waitUntil: 'domcontentloaded' })
        .catch(() => {});
      await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();
      expect(page.url()).toContain('/unauthorized');

      // Try to access moderation API
      const response = await TestHelpers.makeAuthenticatedRequest(page, '/api/admin/moderation', {
        method: 'POST',
        data: { moderationId: 'queue-123', action: 'approve' },
      });
      expect(response.status()).toBe(403);
    });

    test('admin can see all listings including flagged ones', async ({ page }) => {
      await page.route('**/api/admin/listings**', async route => {
        const url = route.request().url();
        if (url.includes('/api/admin/listings/stats')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              totalListings: 1,
              publishedListings: 1,
              unpublishedListings: 0,
              pendingListings: 0,
              draftListings: 0,
              featuredListings: 0,
              listingsByType: { coworking: 1 },
            }),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            listings: [
              {
                id: 'listing-flagged',
                name: 'Flagged Listing',
                slug: 'flagged-listing',
                type: 'coworking',
                status: 'published',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                city: 'Bangkok',
                moderationStatus: 'pending',
                isFeatured: false,
              },
            ],
            pagination: {
              page: 1,
              limit: 20,
              totalCount: 1,
              totalPages: 1,
              hasNextPage: false,
              hasPrevPage: false,
            },
            filters: { search: '', status: null, type: null },
          }),
        });
      });

      await loginAs(page, 'admin', { redirectTo: '/admin/listings' });

      await page
        .waitForURL(/\/admin\/listings/, { waitUntil: 'domcontentloaded', timeout: 15000 })
        .catch(() => {});
      await page.waitForLoadState('domcontentloaded').catch(() => {});

      await expect(page.getByTestId('admin-listings-page')).toBeVisible();
      await expect(page.getByTestId('listings-table')).toBeVisible();
      await expect(page.getByTestId('listing-row-listing-flagged')).toBeVisible();
      await expect(
        page.getByTestId('listing-row-listing-flagged').getByText('Pending')
      ).toBeVisible();
      await expect(page.getByTitle('Delete')).toBeVisible();
    });
  });

  // Error Flow Tests
  test.describe('error handling flows', () => {
    test('handles invalid listing creation gracefully', async ({ page }) => {
      await loginAs(page, 'venueOwner');

      await page
        .goto('/dashboard/listings/new', { waitUntil: 'domcontentloaded', timeout: 15000 })
        .catch(() => {});
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      await page
        .waitForURL(/\/dashboard\/listings\/new/, {
          timeout: 15000,
          waitUntil: 'domcontentloaded',
        })
        .catch(() => {});
      await page.waitForSelector('button[type="submit"]', { state: 'attached' });

      // Try to submit without required fields
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/\/dashboard\/listings\/new/);
      await expect(page.getByRole('heading', { name: 'Add New Listing' })).toBeVisible();
    });

    test('prevents unauthorized listing modification', async ({ page }) => {
      const listingId = 'listing-bangkok-eco-hub';

      // Try to modify as a regular user
      await loginAs(page, 'user');

      // Attempt to edit
      await page
        .goto(`/dashboard/listings/edit/${listingId}`, { waitUntil: 'domcontentloaded' })
        .catch(() => {});
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      await page
        .waitForURL(/\/unauthorized/, { timeout: 15000, waitUntil: 'domcontentloaded' })
        .catch(() => {});
      await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();
      expect(page.url()).toContain('/unauthorized');

      // Attempt to delete
      const deleteResponse = await TestHelpers.makeAuthenticatedRequest(
        page,
        `/api/listings/manage/${listingId}`,
        {
          method: 'DELETE',
        }
      );
      expect(deleteResponse.status()).toBe(401);
    });
  });

  // Concurrency Tests
  test.describe('concurrent operations', () => {
    test('handles simultaneous reviews correctly', async ({ page, context }) => {
      test.setTimeout(120000);
      const listingSlug = 'banyan-tree-phuket';

      await context.route('**/api/auth/session', async route => {
        const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'e2e-user',
              name: 'E2E Reviewer',
              email: 'e2e-user@example.com',
              role: 'user',
            },
            expires,
          }),
        });
      });

      await context.route('**/api/reviews', async route => {
        const body = route.request().postDataJSON?.() as
          | { rating?: number; comment?: string }
          | undefined;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              id: `review-${Date.now()}`,
              rating: body?.rating ?? 5,
              comment: body?.comment ?? 'Great place!',
              approved: false,
              createdAt: new Date().toISOString(),
              user: { name: 'E2E Reviewer' },
            },
          }),
        });
      });

      // Create two user pages
      const userPage1 = await context.newPage();
      const userPage2 = await context.newPage();

      // Navigate to listing
      await userPage1
        .goto(`/listings/${listingSlug}`, { waitUntil: 'domcontentloaded', timeout: 15000 })
        .catch(() => {});
      await userPage2
        .goto(`/listings/${listingSlug}`, { waitUntil: 'domcontentloaded', timeout: 15000 })
        .catch(() => {});
      await expect(userPage1.getByTestId('review-comment-field')).toBeVisible();
      await expect(userPage2.getByTestId('review-comment-field')).toBeVisible();

      // Submit reviews simultaneously
      const user1Comment = 'Great place!';
      const user2Comment = 'Good experience';
      await Promise.all([
        TestHelpers.submitReview(userPage1, {
          rating: 5,
          comment: user1Comment,
        }),
        TestHelpers.submitReview(userPage2, {
          rating: 4,
          comment: user2Comment,
        }),
      ]);

      await expect(userPage1.getByTestId('review-success-message')).toBeVisible();
      await expect(userPage1.getByTestId('submitted-review-comment')).toHaveText(user1Comment);
      await expect(userPage2.getByTestId('review-success-message')).toBeVisible();
      await expect(userPage2.getByTestId('submitted-review-comment')).toHaveText(user2Comment);
    });
  });

  // Cross-Page Persistence Tests
  test.describe('data persistence', () => {
    test('maintains state across page refreshes', async ({ page }) => {
      await loginAs(page, 'venueOwner');

      await page.route('**/api/listings/manage**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              listings: [
                {
                  _id: 'listing-persist-1',
                  name: testData.listing.name,
                  city: { name: testData.listing.city },
                  status: 'published',
                },
              ],
            },
          }),
        });
      });

      await page
        .goto('/dashboard/listings', { waitUntil: 'domcontentloaded', timeout: 15000 })
        .catch(() => {});
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      await page
        .waitForURL(/\/dashboard\/listings/, { timeout: 15000, waitUntil: 'domcontentloaded' })
        .catch(() => {});
      await expect(page.getByText(testData.listing.name)).toBeVisible({ timeout: 10000 });

      await page.reload();
      await expect(page.getByText(testData.listing.name)).toBeVisible({ timeout: 10000 });
    });

    test('maintains session across multiple tabs', async ({ context }) => {
      // Login in first tab
      const page1 = await context.newPage();
      await loginAs(page1, 'venueOwner');
      const venueOwnerSession = getSessionForRole('venueOwner');
      const displayName =
        venueOwnerSession?.user.name ?? venueOwnerSession?.user.email ?? 'Your account';

      // Open new tab
      const page2 = await context.newPage();
      await page2
        .goto('/profile', { waitUntil: 'domcontentloaded', timeout: 15000 })
        .catch(() => {});
      await page2
        .waitForURL(/\/profile/, { timeout: 15000, waitUntil: 'domcontentloaded' })
        .catch(() => {});

      // Verify logged in state persists
      await expect(page2.getByRole('heading', { name: displayName, level: 1 })).toBeVisible({
        timeout: 10000,
      });
    });
  });
});
