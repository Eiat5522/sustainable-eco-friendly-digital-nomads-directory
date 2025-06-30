import type { Page } from '@playwright/test';
import { test as base, expect } from '@playwright/test';

// Extend base test with custom fixtures
export const test = base.extend<{
  authenticatedPage: Page;
  adminPage: Page;
}>({
  // Add authenticated page fixture
  authenticatedPage: async ({ page }, use) => {
    // Log in
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Use the authenticated page
    await use(page);
  },

  // Add admin page fixture
  adminPage: async ({ page }, use) => {
    // Log in as admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', process.env.ADMIN_EMAIL || 'admin@example.com');
    await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD || 'adminpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');

    // Use the admin page
    await use(page);
  },
});

export { expect };

// Custom test helpers
export const TestHelpers = {
  // Fill out listing form
  async fillListingForm(page: Page, data: any = {}) {
    const defaultData = {
      name: 'Test Eco Space',
      description: 'A sustainable coworking space',
      category: 'coworking',
      city: 'Bangkok',
      address: '123 Green Street',
      ...data,
    };

    await page.fill('input[name="name"]', defaultData.name);
    await page.fill('textarea[name="description"]', defaultData.description);
    await page.selectOption('select[name="category"]', defaultData.category);
    await page.fill('input[name="city"]', defaultData.city);
    await page.fill('input[name="address"]', defaultData.address);
  },

  // Verify listing card content
  async verifyListingCard(page: Page, data: any) {
    const card = page.locator('[data-testid="listing-card"]').filter({ hasText: data.name });
    await expect(card).toBeVisible();
    await expect(card.locator('[data-testid="listing-category"]')).toHaveText(data.category);
    await expect(card.locator('[data-testid="listing-city"]')).toHaveText(data.city);
  },

  // Submit a review
  async submitReview(page: Page, data: any = {}) {
    const defaultData = {
      rating: 5,
      comment: 'Great eco-friendly space!',
      ...data,
    };

    await page.click('button[data-testid="write-review-button"]');
    await page.fill('input[name="rating"]', String(defaultData.rating));
    await page.fill('textarea[name="comment"]', defaultData.comment);
    await page.click('button[type="submit"]');
  },

  // Check for toast notification
  async checkToast(page: Page, message: string) {
    const toast = page.locator('[data-testid="toast"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(message);
  },

  // Authentication helpers
  async loginAsUser(page: Page, email?: string, password?: string) {
    await page.goto('/auth/signin');
    await page.fill(
      'input[name="email"]',
      email || process.env.TEST_USER_EMAIL || 'test@example.com'
    );
    await page.fill(
      'input[name="password"]',
      password || process.env.TEST_USER_PASSWORD || 'password123'
    );
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  },

  async loginAsVenueOwner(page: Page, email?: string, password?: string) {
    await page.goto('/auth/signin');
    await page.fill(
      'input[name="email"]',
      email || process.env.VENUE_OWNER_EMAIL || 'owner@example.com'
    );
    await page.fill(
      'input[name="password"]',
      password || process.env.VENUE_OWNER_PASSWORD || 'owner123'
    );
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard/venues');
  },

  async loginAsAdmin(page: Page, email?: string, password?: string) {
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', email || process.env.ADMIN_EMAIL || 'admin@example.com');
    await page.fill('input[name="password"]', password || process.env.ADMIN_PASSWORD || 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
  },

  async createListing(page: Page, data: any = {}) {
    // Navigate to create listing page
    await page.goto('/dashboard/listings/new');

    // Fill form
    await TestHelpers.fillListingForm(page, data);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success and get listing ID from URL
    await TestHelpers.checkToast(page, 'Listing created successfully');
    const listingId = page.url().split('/').pop();

    // Get listing data
    const response = await TestHelpers.makeAuthenticatedRequest(page, `/api/listings/${listingId}`);
    const listing = await response.json();

    return listing;
  },

  // API test helpers
  async makeAuthenticatedRequest(page: Page, endpoint: string, options: any = {}) {
    // Get session token
    const token = await page.evaluate(() => {
      return localStorage.getItem('token');
    });

    // Make authenticated request
    return page.request.fetch(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// Custom assertions
export const CustomAssertions = {
  // Assert pagination
  async assertPagination(
    page: Page,
    { currentPage, totalPages }: { currentPage: number; totalPages: number }
  ) {
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-page"]')).toHaveText(String(currentPage));
    await expect(page.locator('[data-testid="total-pages"]')).toHaveText(String(totalPages));
  },

  // Assert form validation error
  async assertFormError(page: Page, fieldName: string, errorMessage: string) {
    const errorElement = page.locator(`[data-testid="error-${fieldName}"]`);
    await expect(errorElement).toBeVisible();
    await expect(errorElement).toHaveText(errorMessage);
  },

  // Assert authenticated state
  async assertAuthenticated(page: Page) {
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  },

  // Assert admin access
  async assertAdminAccess(page: Page) {
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
  },
};
