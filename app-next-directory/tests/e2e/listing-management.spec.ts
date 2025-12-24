import { expect, test } from '@playwright/test';
import { getSessionForRole } from '@tests/helpers/test-data';
import { TestHelpers } from '../utils/test-utils';

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
      await TestHelpers.loginAsUser(page);

      // Try to access admin routes
      await page.goto('/admin/dashboard');
      await expect(page).toHaveURL(/\/403/);

      await page.goto('/admin/listings');
      await expect(page).toHaveURL(/\/403/);

      // Try to access moderation API
      const response = await TestHelpers.makeAuthenticatedRequest(
        page,
        '/api/admin/moderation',
        {
          method: 'POST',
          data: { moderationId: 'queue-123', action: 'approve' },
        }
      );
      expect(response.status()).toBe(403);
    });

    test('admin can see all listings including flagged ones', async ({ page }) => {
      await TestHelpers.loginAsAdmin(page);

      await page.route('**/api/admin/listings?**', async route => {
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

      await page.route('**/api/admin/listings/stats', async route => {
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
      });

      await page.goto('/admin/listings');

      await expect(page.getByTestId('admin-listings-page')).toBeVisible();
      await expect(page.getByTestId('listings-table')).toBeVisible();
      await expect(page.getByTestId('listing-row-listing-flagged')).toBeVisible();
      await expect(page.getByText('Pending')).toBeVisible();
      await expect(page.getByTitle('Delete')).toBeVisible();
    });
  });

  // Error Flow Tests
  test.describe('error handling flows', () => {
    test('handles invalid listing creation gracefully', async ({ page }) => {
      await TestHelpers.loginAsVenueOwner(page);

      await page.goto('/dashboard/listings/new');

      // Try to submit without required fields
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/\/dashboard\/listings\/new/);
      await expect(page.getByRole('heading', { name: 'Add New Listing' })).toBeVisible();
    });

    test('prevents unauthorized listing modification', async ({ page }) => {
      const listingId = 'listing-bangkok-eco-hub';

      // Try to modify as a regular user
      await TestHelpers.loginAsUser(page);

      // Attempt to edit
      await page.goto(`/dashboard/listings/edit/${listingId}`).catch(() => undefined);
      await expect(page).toHaveURL(/\/403/);

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
      const listingSlug = 'banyan-tree-phuket';

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

      await TestHelpers.loginAsUser(userPage1);
      await TestHelpers.loginAsUser(userPage2);

      // Navigate to listing
      await userPage1.goto(`/listings/${listingSlug}`);
      await userPage2.goto(`/listings/${listingSlug}`);

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
      await TestHelpers.loginAsVenueOwner(page);

      await page.route('**/api/listings', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            listings: [
              {
                _id: 'listing-persist-1',
                name: testData.listing.name,
                city: { name: testData.listing.city },
                status: 'published',
              },
            ],
          }),
        });
      });

      await page.goto('/dashboard/listings');
      await expect(page.getByText(testData.listing.name)).toBeVisible();

      await page.reload();
      await expect(page.getByText(testData.listing.name)).toBeVisible();
    });

    test('maintains session across multiple tabs', async ({ context }) => {
      // Login in first tab
      const page1 = await context.newPage();
      await TestHelpers.loginAsVenueOwner(page1);
      const venueOwnerSession = getSessionForRole('venueOwner');
      const displayName =
        venueOwnerSession?.user.name ?? venueOwnerSession?.user.email ?? 'Your account';

      // Open new tab
      const page2 = await context.newPage();
      await page2.goto('/profile');

      // Verify logged in state persists
      await expect(page2.getByRole('heading', { name: displayName })).toBeVisible();
    });
  });
});
