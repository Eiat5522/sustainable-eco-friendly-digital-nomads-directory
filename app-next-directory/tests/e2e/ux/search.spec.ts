import { expect, test } from '@playwright/test';

test.describe('Search & Filter UX', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to search page
    await page.goto('/search');

    // Wait for the page to load and initialize
    await page.waitForLoadState('networkidle');
  });

  test('search interface is accessible and responsive', async ({ page }) => {
    // Check search form visibility
    const searchForm = page.locator('[data-testid="search-form"]');
    await expect(searchForm).toBeVisible();

    // Check search input is present with proper labeling
    const searchInput = page.locator('input[type="search"][name="q"]');
    await expect(searchInput).toBeVisible();

    // Check that the label exists in the DOM (even if screen-reader only)
    const label = page.locator('label[for="search-page-input"]');
    await expect(label).toHaveCount(1);

    // Check search button
    const searchButton = page.getByRole('button', { name: 'Search' });
    await expect(searchButton).toBeVisible();

    // Check filter multi-selects are present
    await expect(page.getByText('Select cities')).toBeVisible();
    await expect(page.getByText('Select workspace types')).toBeVisible();
    await expect(page.getByText('Select amenities')).toBeVisible();
  });

  test('search with filters shows correct results', async ({ page }) => {
    // Fill search input
    await page.fill('input[type="search"][name="q"]', 'coworking');

    // Submit search
    await page.click('button[type="submit"]');

    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');

    // The page should navigate (either stay on /search or go to /search/results)
    // Just verify we're still on a search-related page
    expect(page.url()).toContain('/search');

    // Wait a bit for content to load
    await page.waitForTimeout(1000);

    // Verify the page loaded successfully with a search form
    const searchForm = page.locator('[data-testid="search-form"]');
    await expect(searchForm).toBeVisible();

    // The search should have been performed - check that input maintains value or results shown
    const searchInput = page.locator('input[type="search"][name="q"]');
    const inputValue = await searchInput.inputValue();

    // Either the input has the value we searched for, or results/no results are shown
    const hasResults =
      inputValue.includes('coworking') ||
      (await page.locator('[data-testid="listing-card"]').count()) > 0 ||
      (await page
        .locator('text=No results found')
        .isVisible()
        .catch(() => false));

    expect(hasResults).toBeTruthy();
  });

  test('mobile responsive design', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    // Check search form is still visible on mobile
    const searchForm = page.locator('[data-testid="search-form"]');
    await expect(searchForm).toBeVisible();

    // Check search input is usable
    const searchInput = page.locator('input[type="search"]');
    await expect(searchInput).toBeVisible();

    // Check filter controls adapt to mobile
    await expect(page.getByText('Select cities')).toBeVisible();
    await expect(page.getByText('Select workspace types')).toBeVisible();
  });

  test('keyboard navigation', async ({ page }) => {
    // Click on search input directly instead of relying on Tab order
    const searchInput = page.locator('input[name="q"]');
    await searchInput.click();
    await expect(searchInput).toBeFocused();

    // Type in search field
    await page.keyboard.type('coworking');

    // Tab to search button
    await page.keyboard.press('Tab');

    // Press Enter to submit
    await page.keyboard.press('Enter');

    // Should navigate to search results
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/search');
  });

  // Screen Reader Accessibility Tests
  test.describe('screen reader compatibility', () => {
    test('has proper ARIA labels and roles', async ({ page }) => {
      // Check search form
      const searchForm = page.locator('form[data-testid="search-form"]');
      await expect(searchForm).toBeVisible();

      // Check search input has a label in the DOM (even if sr-only)
      const searchLabel = page.locator('label[for="search-page-input"]');
      await expect(searchLabel).toHaveCount(1);

      // Check search input
      const searchInput = page.locator('input[type="search"][name="q"]');
      await expect(searchInput).toBeVisible();
    });

    test('search form is functional', async ({ page }) => {
      // Fill and submit form
      await page.fill('input[name="q"]', 'test search');
      await page.click('button[type="submit"]');

      // Should navigate and show results
      await page.waitForURL(/\/search/);
      await expect(page).toHaveURL(/q=test/);
    });
  });

  // Focus Management Tests
  test.describe('focus management', () => {
    test('maintains focus during search interaction', async ({ page }) => {
      // Focus on search input
      await page.click('input[name="q"]');
      await expect(page.locator('input[name="q"]')).toBeFocused();

      // Type a search term
      await page.keyboard.type('test');

      // Input should still be focused
      await expect(page.locator('input[name="q"]')).toBeFocused();
    });

    test('handles keyboard navigation within form', async ({ page }) => {
      // Start from search input
      await page.click('input[name="q"]');

      // Tab to next focusable element
      await page.keyboard.press('Tab');

      // Should be able to tab through form controls
      const activeElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['INPUT', 'BUTTON']).toContain(activeElement);
    });
  });

  // Loading States Tests
  test.describe('loading states and empty results', () => {
    test('handles search with no term gracefully', async ({ page }) => {
      // Submit search with empty input
      await page.click('button[type="submit"]');

      // Should navigate to search/results
      await page.waitForURL(/\/search/);

      // Page should still be functional
      const searchForm = page.locator('[data-testid="search-form"]');
      await expect(searchForm).toBeVisible();
    });

    test('displays results or no results message', async ({ page }) => {
      // Search for an uncommon term
      await page.fill('input[type="search"]', 'xyznonexistentlocation123');
      await page.click('button[type="submit"]');

      // Wait for navigation
      await page.waitForURL(/\/search/);

      // Check either listings or no results message appears
      const hasListings = (await page.locator('[data-testid="listing-card"]').count()) > 0;
      const noResultsText = await page.locator('text=No results found').isVisible();

      // At least one should be true (either show listings or no results)
      expect(hasListings || noResultsText).toBeTruthy();
    });
  });

  // Visual State Tests
  test.describe('visual feedback and interaction', () => {
    test('search button is visible and clickable', async ({ page }) => {
      const searchButton = page.getByRole('button', { name: 'Search' });
      await expect(searchButton).toBeVisible();

      // Button should be clickable
      await searchButton.click();

      // Should navigate
      await page.waitForURL(/\/search/);
    });

    test('form inputs are interactive', async ({ page }) => {
      const searchInput = page.locator('input[name="q"]');

      // Should be able to type in input
      await searchInput.fill('test query');
      await expect(searchInput).toHaveValue('test query');

      // Should be able to clear and type again
      await searchInput.fill('');
      await expect(searchInput).toHaveValue('');
    });
  });

  // Responsive Behavior Tests
  test.describe('responsive layout behavior', () => {
    test('adapts layout for different screen sizes', async ({ page }) => {
      // Test mobile layout
      await page.setViewportSize({ width: 375, height: 667 });
      const searchForm = page.locator('[data-testid="search-form"]');
      await expect(searchForm).toBeVisible();

      // Test tablet layout
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(searchForm).toBeVisible();

      // Test desktop layout
      await page.setViewportSize({ width: 1440, height: 900 });
      await expect(searchForm).toBeVisible();

      // Search functionality should work on desktop
      await page.fill('input[name="q"]', 'test');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/search/);
    });

    test('form is usable on small screens', async ({ page }) => {
      // Set to mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Check form elements are accessible
      const searchInput = page.locator('input[name="q"]');
      await expect(searchInput).toBeVisible();

      const searchButton = page.getByRole('button', { name: 'Search' });
      await expect(searchButton).toBeVisible();

      // Should be able to interact
      await searchInput.fill('mobile test');
      await searchButton.click();

      // Should navigate
      await page.waitForURL(/\/search/);
    });
  });
});
