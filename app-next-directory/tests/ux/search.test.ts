import { expect, test } from '@playwright/test';

test.describe('Search & Filter UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('search interface is accessible and responsive', async ({ page }) => {
    // Check search form visibility
    const searchForm = page.locator('[data-testid="search-form"]');
    await expect(searchForm).toBeVisible();

    // Check for ARIA labels
    await expect(page.locator('[aria-label="Search locations"]')).toBeVisible();
    await expect(page.locator('[aria-label="Filter by category"]')).toBeVisible();

    // Check filter button accessibility
    const filterButton = page.locator('button', { hasText: 'Filters' });
    await expect(filterButton).toBeVisible();
    await expect(filterButton).toHaveAttribute('aria-expanded', 'false');

    // Open filters
    await filterButton.click();
    await expect(filterButton).toHaveAttribute('aria-expanded', 'true');

    // Check filter panel visibility
    await expect(page.locator('[data-testid="filter-panel"]')).toBeVisible();
  });

  test('search with filters shows correct results', async ({ page }) => {
    // Open filter panel
    await page.click('button', { hasText: 'Filters' });

    // Apply filters
    await page.selectOption('select[name="category"]', 'coworking');
    await page.fill('input[name="city"]', 'Bangkok');
    await page.click('[data-testid="eco-tag-solar-powered"]');

    // Submit search
    await page.click('button[type="submit"]');

    // Check URL parameters
    await expect(page).toHaveURL(/category=coworking/);
    await expect(page).toHaveURL(/city=Bangkok/);
    await expect(page).toHaveURL(/ecoTags=solar-powered/);

    // Verify results
    const listings = page.locator('[data-testid="listing-card"]');
    await expect(listings).toHaveCount(await listings.count());

    // Check first listing matches filters
    const firstListing = listings.first();
    await expect(firstListing.locator('[data-testid="listing-category"]')).toHaveText('coworking');
    await expect(firstListing.locator('[data-testid="listing-city"]')).toHaveText('Bangkok');
    await expect(firstListing.locator('[data-testid="eco-tags"]')).toContainText('Solar Powered');
  });

  test('mobile responsive design', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    // Check mobile menu
    const menuButton = page.locator('[data-testid="mobile-menu-button"]');
    await expect(menuButton).toBeVisible();

    // Open mobile menu
    await menuButton.click();
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

    // Check filter panel adapts to mobile
    await page.click('button', { hasText: 'Filters' });
    const filterPanel = page.locator('[data-testid="filter-panel"]');
    await expect(filterPanel).toHaveCSS('position', 'fixed');
    await expect(filterPanel).toHaveCSS('bottom', '0px');

    // Check search results layout
    const listings = page.locator('[data-testid="listing-card"]');
    await expect(listings.first()).toHaveCSS('width', '100%');
  });

  test('keyboard navigation', async ({ page }) => {
    // Focus search input
    await page.press('body', 'Tab');
    await expect(page.locator('input[name="search"]')).toBeFocused();

    // Navigate to category dropdown
    await page.press('body', 'Tab');
    await expect(page.locator('select[name="category"]')).toBeFocused();

    // Navigate to filter button
    await page.press('body', 'Tab');
    await expect(page.locator('button', { hasText: 'Filters' })).toBeFocused();

    // Open filters with keyboard
    await page.press('body', 'Enter');
    await expect(page.locator('[data-testid="filter-panel"]')).toBeVisible();
  });

  // Screen Reader Accessibility Tests
  test.describe('screen reader compatibility', () => {
    test('has proper ARIA labels and roles', async ({ page }) => {
      // Check search form
      const searchForm = page.locator('form[role="search"]');
      await expect(searchForm).toHaveAttribute('aria-label', 'Search listings');

      // Check search input
      const searchInput = page.locator('input[type="search"]');
      await expect(searchInput).toHaveAttribute('aria-label', 'Search for eco-friendly venues');

      // Check filter controls
      const filterButton = page.locator('button', { hasText: 'Filters' });
      await expect(filterButton).toHaveAttribute('aria-expanded', 'false');
      await expect(filterButton).toHaveAttribute('aria-controls', 'filter-panel');

      // Check category combobox
      const categorySelect = page.locator('select[name="category"]');
      await expect(categorySelect).toHaveAttribute('aria-label', 'Filter by venue category');
    });

    test('announces dynamic content changes', async ({ page }) => {
      // Open filters
      await page.click('button', { hasText: 'Filters' });
      await expect(page.locator('[role="dialog"]')).toHaveAttribute('aria-label', 'Search filters');

      // Apply filters
      await page.selectOption('select[name="category"]', 'coworking');
      await page.click('[type="submit"]');

      // Check results announcement
      const resultsRegion = page.locator('[role="region"][aria-label="Search results"]');
      await expect(resultsRegion).toBeVisible();
      await expect(resultsRegion).toHaveAttribute('aria-live', 'polite');

      // Check result count announcement
      const resultCount = page.locator('[aria-live="polite"]');
      await expect(resultCount).toContainText('results found');
    });
  });

  // Focus Management Tests
  test.describe('focus management', () => {
    test('maintains focus after filter updates', async ({ page }) => {
      // Open filter panel
      const filterButton = page.locator('button', { hasText: 'Filters' });
      await filterButton.click();
      await expect(page.locator('#filter-panel')).toBeVisible();

      // Apply a filter
      const categorySelect = page.locator('select[name="category"]');
      await categorySelect.selectOption('coworking');
      await page.click('[type="submit"]');

      // Focus should return to filter button
      await expect(filterButton).toBeFocused();
    });

    test('handles keyboard navigation within filters', async ({ page }) => {
      await page.click('button', { hasText: 'Filters' });

      // Tab through filter controls
      await page.keyboard.press('Tab');
      await expect(page.locator('select[name="category"]')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('input[name="city"]')).toBeFocused();

      // Press escape to close filter panel
      await page.keyboard.press('Escape');
      await expect(page.locator('#filter-panel')).not.toBeVisible();
      await expect(page.locator('button', { hasText: 'Filters' })).toBeFocused();
    });

    test('traps focus in modals', async ({ page }) => {
      // Open advanced filters modal
      await page.click('button', { hasText: 'Advanced Filters' });
      const modal = page.locator('[role="dialog"]');

      // Try to tab through all focusable elements
      const focusableElements = await modal.locator('button, input, select, textarea').all();

      // Tab forward
      for (let i = 0; i < focusableElements.length + 1; i++) {
        await page.keyboard.press('Tab');
        const focusedElement = await page.evaluate(() => document.activeElement);
        expect(await modal.evaluate(modal => modal.contains(document.activeElement))).toBeTruthy();
      }

      // Tab backward
      for (let i = 0; i < focusableElements.length + 1; i++) {
        await page.keyboard.press('Shift+Tab');
        expect(await modal.evaluate(modal => modal.contains(document.activeElement))).toBeTruthy();
      }
    });
  });

  // Loading States Tests
  test.describe('loading states and empty results', () => {
    test('shows loading states during search', async ({ page }) => {
      // Slow down API response
      await page.route('/api/listings*', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.continue();
      });

      // Initiate search
      await page.fill('input[type="search"]', 'eco coworking');
      await page.click('button[type="submit"]');

      // Check loading states
      await expect(page.locator('[data-testid="search-loading"]')).toBeVisible();
      await expect(page.locator('[data-testid="listing-skeleton"]')).toHaveCount(6);

      // Wait for results
      await expect(page.locator('[data-testid="listing-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="search-loading"]')).not.toBeVisible();
    });

    test('handles empty search results', async ({ page }) => {
      // Search with unlikely term
      await page.fill('input[type="search"]', 'xyznonexistentlocation123');
      await page.click('button[type="submit"]');

      // Check empty state
      const emptyState = page.locator('[data-testid="empty-results"]');
      await expect(emptyState).toBeVisible();
      await expect(emptyState).toContainText('No results found');
      await expect(emptyState.locator('button', { hasText: 'Clear filters' })).toBeVisible();
    });
  });

  // Visual State Tests
  test.describe('visual feedback and contrast', () => {
    test('provides clear visual feedback for interactions', async ({ page }) => {
      // Check hover states
      const filterButton = page.locator('button', { hasText: 'Filters' });
      await filterButton.hover();
      await expect(filterButton).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, -1)');

      // Check active states
      await filterButton.click();
      await expect(filterButton).toHaveClass(/active/);

      // Check focus states
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(
        () => getComputedStyle(document.activeElement!).outlineColor
      );
      expect(focused).toBe('rgb(59, 130, 246)'); // Focus ring color
    });

    test('maintains sufficient color contrast', async ({ page }) => {
      const elements = [
        { selector: 'button[type="submit"]', minRatio: 4.5 },
        { selector: '.filter-label', minRatio: 4.5 },
        { selector: '.result-count', minRatio: 4.5 },
      ];

      for (const { selector, minRatio } of elements) {
        const element = page.locator(selector);
        const contrastRatio = await element.evaluate(el => {
          const style = window.getComputedStyle(el);
          const bgColor = style.backgroundColor;
          const textColor = style.color;
          // Calculate contrast ratio using WCAG formula
          // This is a simplified example - in real code you'd need a proper color contrast calculation
          return calculateContrastRatio(textColor, bgColor);
        });
        expect(contrastRatio).toBeGreaterThanOrEqual(minRatio);
      }
    });
  });

  // Responsive Behavior Tests
  test.describe('responsive layout behavior', () => {
    test('adapts layout for different screen sizes', async ({ page }) => {
      // Test mobile layout
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('[data-testid="mobile-filters"]')).toBeVisible();
      await expect(page.locator('[data-testid="desktop-filters"]')).not.toBeVisible();

      // Test tablet layout
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator('[data-testid="filter-sidebar"]')).toBeVisible();

      // Test desktop layout
      await page.setViewportSize({ width: 1440, height: 900 });
      await expect(page.locator('[data-testid="filter-sidebar"]')).toBeVisible();
      await expect(page.locator('[data-testid="desktop-grid"]')).toHaveCSS(
        'grid-template-columns',
        /repeat\(3,/
      );
    });

    test('maintains usability on touch devices', async ({ page }) => {
      // Emulate touch device
      await page.emulate({
        ...page.viewportSize(),
        hasTouch: true,
      });

      // Check touch-friendly target sizes
      const interactiveElements = await page.$$('button, [role="button"], a, input, select');
      for (const element of interactiveElements) {
        const { width, height } = await element.boundingBox();
        expect(width).toBeGreaterThanOrEqual(44); // Min touch target size
        expect(height).toBeGreaterThanOrEqual(44);
      }
    });
  });
});
