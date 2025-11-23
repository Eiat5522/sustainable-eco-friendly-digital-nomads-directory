import { expect, test } from './fixtures';

test.describe('Role-Based Access Control (RBAC)', () => {

  test.describe('Admin Access', () => {
    test('admin can access all admin routes', async ({ adminPage }) => {
      // Test admin dashboard access
      await adminPage.goto('/admin');
      await expect(adminPage.locator('h1:has-text("Admin Dashboard")')).toBeVisible();

      // Test user management
      await adminPage.goto('/admin/users');
      await expect(adminPage.locator('h1:has-text("User Management")')).toBeVisible();

      // Test content management
      await adminPage.goto('/admin/content');
      await expect(adminPage.locator('h1:has-text("Content Management")')).toBeVisible();
    });

    test('admin can manage user roles', async ({ adminPage }) => {
      await adminPage.goto('/admin/users');

      // Find a user row and change role
      const userRow = adminPage.locator('[data-testid="user-row"]').first();
      await userRow.locator('[data-testid="role-select"]').selectOption('editor');
      await userRow.locator('[data-testid="save-role"]').click();

      await expect(adminPage.locator('text=Role updated successfully')).toBeVisible();
    });

    test('admin can delete users', async ({ adminPage }) => {
      await adminPage.goto('/admin/users');

      const userRow = adminPage.locator('[data-testid="user-row"]').first();
      await userRow.locator('[data-testid="delete-user"]').click();

      // Confirm deletion
      await adminPage.locator('[data-testid="confirm-delete"]').click();

      await expect(adminPage.locator('text=User deleted successfully')).toBeVisible();
    });
  });

  test.describe('Venue Owner Access', () => {
    test('venue owner can manage their listings', async ({ venueOwnerPage }) => {
      await venueOwnerPage.goto('/dashboard');

      await expect(venueOwnerPage.locator('text=My Listings')).toBeVisible();
      await expect(venueOwnerPage.locator('[data-testid="add-listing"]')).toBeVisible();
    });

    test('venue owner can create new listings', async ({ venueOwnerPage }) => {
      await venueOwnerPage.goto('/listings/create');

      // Fill out listing form
      await venueOwnerPage.fill('input[name="name"]', 'Test Venue');
      await venueOwnerPage.fill('textarea[name="description"]', 'Test Description');
      await venueOwnerPage.fill('input[name="location"]', 'Test Location');

      await venueOwnerPage.click('button[type="submit"]');

      await expect(venueOwnerPage.locator('text=Listing created successfully')).toBeVisible();
    });

    test('venue owner cannot access admin routes', async ({ venueOwnerPage }) => {
      await venueOwnerPage.goto('/admin');

      // Should be redirected or show access denied
      await expect(venueOwnerPage.locator('text=Access denied')).toBeVisible();
    });

    test('venue owner can only edit their own listings', async ({ venueOwnerPage }) => {
      await venueOwnerPage.goto('/dashboard');

      // Should see edit buttons only for their listings
      const ownListing = venueOwnerPage.locator('[data-testid="own-listing"]').first();
      await expect(ownListing.locator('[data-testid="edit-listing"]')).toBeVisible();

      // Try to access another user's listing edit page directly
      await venueOwnerPage.goto('/listings/other-user-listing-id/edit');
      await expect(venueOwnerPage.locator('text=Access denied')).toBeVisible();
    });
  });

  test.describe('Regular User Access', () => {
    test('regular user can view listings', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/listings');

      await expect(authenticatedPage.locator('[data-testid="listings-grid"]')).toBeVisible();
    });

    test('regular user can save favorites', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/listings');

      const listing = authenticatedPage.locator('[data-testid="listing-card"]').first();
      await listing.locator('[data-testid="save-favorite"]').click();

      await expect(authenticatedPage.locator('text=Added to favorites')).toBeVisible();
    });

    test('regular user cannot access admin routes', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/admin');

      await expect(authenticatedPage.locator('text=Access denied')).toBeVisible();
    });

    test('regular user cannot create listings', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/listings/create');

      await expect(authenticatedPage.locator('text=Access denied')).toBeVisible();
    });

    test('regular user can view their profile', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/profile');

      await expect(authenticatedPage.locator('h1:has-text("My Profile")')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="edit-profile"]')).toBeVisible();
    });
  });

  test.describe('Editor Access', () => {
    test('editor can manage content', async ({ page }) => {
      // Login as editor
      await page.goto('/login');
      await page.fill('input[name="email"]', 'editor@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      await page.goto('/admin/content');

      await expect(page.locator('h1:has-text("Content Management")')).toBeVisible();
      await expect(page.locator('[data-testid="create-blog-post"]')).toBeVisible();
    });

    test('editor can moderate listings', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'editor@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      await page.goto('/admin/listings');

      const pendingListing = page.locator('[data-testid="pending-listing"]').first();
      await pendingListing.locator('[data-testid="approve-listing"]').click();

      await expect(page.locator('text=Listing approved')).toBeVisible();
    });

    test('editor cannot access user management', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'editor@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      await page.goto('/admin/users');

      await expect(page.locator('text=Access denied')).toBeVisible();
    });
  });

  test.describe('Cross-Role Interactions', () => {
    test('role hierarchy is respected', async ({ page }) => {
      // Test that higher roles can perform lower role actions
      await page.goto('/login');
      await page.fill('input[name="email"]', 'admin@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Admin should be able to do editor tasks
      await page.goto('/admin/content');
      await expect(page.locator('[data-testid="create-blog-post"]')).toBeVisible();

      // Admin should be able to do venue owner tasks
      await page.goto('/listings/create');
      await expect(page.locator('form[data-testid="listing-form"]')).toBeVisible();
    });

    test('role changes take effect immediately', async ({ adminPage, page: userPage }) => {
      // Admin changes a user's role
      await adminPage.goto('/admin/users');
      const userRow = adminPage.locator('[data-testid="user-row"]').first();
      await userRow.locator('[data-testid="role-select"]').selectOption('venueOwner');
      await userRow.locator('[data-testid="save-role"]').click();

      // User logs in and should have new permissions
      await userPage.goto('/login');
      await userPage.fill('input[name="email"]', 'test@example.com');
      await userPage.fill('input[name="password"]', 'password123');
      await userPage.click('button[type="submit"]');

      // Should now be able to create listings
      await userPage.goto('/listings/create');
      await expect(userPage.locator('form[data-testid="listing-form"]')).toBeVisible();
    });
  });
});
