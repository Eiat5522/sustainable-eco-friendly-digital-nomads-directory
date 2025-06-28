import { expect, test } from '@playwright/test';
import { CustomAssertions, TestHelpers } from '../utils/test-utils';

test.describe('Listing Management E2E', () => {
  // Test Data Management
  const testData = {
    listing: {
      name: 'Test Eco Coworking',
      description: 'Sustainable workspace in the heart of Bangkok',
      category: 'coworking',
      city: 'Bangkok',
      address: '123 Green Street',
      ecoTags: ['solar-powered', 'zero-waste'],
    },
    users: {
      regular: {
        email: `user${Date.now()}@example.com`,
        password: 'UserPass123!',
      },
      owner: {
        email: `owner${Date.now()}@example.com`,
        password: 'OwnerPass123!',
      },
    },
  };

  // Role-Based Access Tests
  test.describe('role-based access control', () => {
    test('regular user cannot access admin features', async ({ page }) => {
      await TestHelpers.loginAsUser(
        page,
        testData.users.regular.email,
        testData.users.regular.password
      );

      // Try to access admin routes
      await page.goto('/admin/dashboard');
      await expect(page).toHaveURL('/403'); // Assuming 403 error page

      await page.goto('/admin/listings');
      await expect(page).toHaveURL('/403');

      // Try to access moderation API
      const response = await TestHelpers.makeAuthenticatedRequest(
        page,
        '/api/admin/reviews/moderate',
        {
          method: 'POST',
          data: { reviewId: '123', action: 'approve' },
        }
      );
      expect(response.status()).toBe(403);
    });

    test('admin can see all listings including flagged ones', async ({ page }) => {
      await TestHelpers.loginAsAdmin(page);

      await page.goto('/admin/listings');

      // Check for flagged listings section
      await expect(page.locator('[data-testid="flagged-listings"]')).toBeVisible();

      // Verify admin controls
      await expect(page.locator('[data-testid="moderate-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="delete-button"]')).toBeVisible();
    });
  });

  // Error Flow Tests
  test.describe('error handling flows', () => {
    test('handles invalid listing creation gracefully', async ({ page }) => {
      await TestHelpers.loginAsVenueOwner(
        page,
        testData.users.owner.email,
        testData.users.owner.password
      );

      await page.goto('/dashboard/listings/new');

      // Try to submit without required fields
      await page.click('button[type="submit"]');

      // Check validation messages
      await CustomAssertions.assertFormError(page, 'name', 'Name is required');
      await CustomAssertions.assertFormError(page, 'category', 'Category is required');

      // Try to submit with invalid data
      await TestHelpers.fillListingForm(page, {
        name: 'a'.repeat(201), // Exceeds max length
        description: '<script>alert("xss")</script>', // Contains invalid characters
        category: 'invalid-category',
      });

      await page.click('button[type="submit"]');

      // Check error messages
      await CustomAssertions.assertFormError(page, 'name', 'Name must be less than 200 characters');
      await CustomAssertions.assertFormError(
        page,
        'description',
        'Description contains invalid characters'
      );
      await CustomAssertions.assertFormError(page, 'category', 'Invalid category selected');
    });

    test('prevents unauthorized listing modification', async ({ page }) => {
      // Create a listing as one owner
      await TestHelpers.loginAsVenueOwner(
        page,
        testData.users.owner.email,
        testData.users.owner.password
      );
      const listing = await TestHelpers.createListing(page, testData.listing);

      // Try to modify as different user
      await TestHelpers.loginAsUser(
        page,
        testData.users.regular.email,
        testData.users.regular.password
      );

      // Attempt to edit
      await page.goto(`/dashboard/listings/${listing.id}/edit`);
      await expect(page).toHaveURL('/403');

      // Attempt to delete
      const deleteResponse = await TestHelpers.makeAuthenticatedRequest(
        page,
        `/api/listings/${listing.id}`,
        {
          method: 'DELETE',
        }
      );
      expect(deleteResponse.status()).toBe(403);
    });
  });

  // Concurrency Tests
  test.describe('concurrent operations', () => {
    test('handles simultaneous reviews correctly', async ({ page, context }) => {
      // Create a listing
      await TestHelpers.loginAsVenueOwner(
        page,
        testData.users.owner.email,
        testData.users.owner.password
      );
      const listing = await TestHelpers.createListing(page, testData.listing);

      // Create two user pages
      const userPage1 = await context.newPage();
      const userPage2 = await context.newPage();

      // Login as different users
      await TestHelpers.loginAsUser(userPage1, 'user1@example.com', 'password123');
      await TestHelpers.loginAsUser(userPage2, 'user2@example.com', 'password123');

      // Navigate to listing
      await userPage1.goto(`/listings/${listing.id}`);
      await userPage2.goto(`/listings/${listing.id}`);

      // Submit reviews simultaneously
      await Promise.all([
        TestHelpers.submitReview(userPage1, {
          rating: 5,
          comment: 'Great place!',
        }),
        TestHelpers.submitReview(userPage2, {
          rating: 4,
          comment: 'Good experience',
        }),
      ]);

      // Verify both reviews were saved
      await userPage1.reload();
      await expect(userPage1.locator('text=Great place!')).toBeVisible();
      await expect(userPage1.locator('text=Good experience')).toBeVisible();
    });
  });

  // Cross-Page Persistence Tests
  test.describe('data persistence', () => {
    test('maintains state across page refreshes', async ({ page }) => {
      // Create a listing
      await TestHelpers.loginAsVenueOwner(
        page,
        testData.users.owner.email,
        testData.users.owner.password
      );
      const listing = await TestHelpers.createListing(page, testData.listing);

      // Refresh page
      await page.reload();

      // Verify listing data persists
      await expect(page.locator('h1')).toHaveText(testData.listing.name);
      await expect(page.locator('[data-testid="listing-description"]')).toHaveText(
        testData.listing.description
      );

      // Navigate away and back
      await page.goto('/dashboard');
      await page.goto(`/dashboard/listings/${listing.id}`);

      // Verify data still exists
      await expect(page.locator('h1')).toHaveText(testData.listing.name);
    });

    test('maintains session across multiple tabs', async ({ context }) => {
      // Login in first tab
      const page1 = await context.newPage();
      await TestHelpers.loginAsVenueOwner(
        page1,
        testData.users.owner.email,
        testData.users.owner.password
      );

      // Open new tab
      const page2 = await context.newPage();
      await page2.goto('/dashboard');

      // Verify logged in state persists
      await expect(page2.locator('[data-testid="user-menu"]')).toBeVisible();
      await expect(page2.locator('[data-testid="user-email"]')).toHaveText(
        testData.users.owner.email
      );
    });
  });

  // Clean up test data after all tests
  test.afterAll(async ({ request }) => {
    // Clean up created listings
    // Note: In a real application, you'd want to track created resources and clean them up properly
    const response = await request.post('/api/test/cleanup', {
      data: {
        emails: [testData.users.regular.email, testData.users.owner.email],
      },
    });
    expect(response.ok()).toBeTruthy();
  });
});
