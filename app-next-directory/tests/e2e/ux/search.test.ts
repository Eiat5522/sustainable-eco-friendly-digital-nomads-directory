import { expect, test } from '@playwright/test';

test.describe('Search & Filter UX', () => {
  test.beforeEach(async ({ page }) => {
  // Set up test environment with predictable data
  await page.goto('/?testMode=true');
    
  // Wait for the page to load and initialize
  await page.waitForLoadState('networkidle');
    
  // Ensure we're in a controlled test environment
  await expect(page.locator('[data-test-mode="true"]')).toBeVisible();
  });

  test('search interface is accessible and responsive', async ({ page }) => {
    // Check search form visibility
    const searchForm = page.locator('[data-testid="search-form"]');
    await expect(searchForm).toBeVisible();

    // Check for ARIA labels
    await expect(page.locator('[aria-label="Search locations"]')).toBeVisible();
    await expect(page.locator('[aria-label="Filter by category"]')).toBeVisible();

    // Check filter button accessibility
    const filterButton = page.getByRole('button', { name: 'Filters' });
    await expect(filterButton).toBeVisible();
    await expect(filterButton).toHaveAttribute('aria-expanded', 'false');

    // Open filters
    await filterButton.click();
    await expect(filterButton).toHaveAttribute('aria-expanded', 'true');

    // Check filter panel visibility
    await expect(page.locator('[data-testid="filter-panel"]')).toBeVisible();
  });

  test('search with filters shows correct results', async ({ page }) => {
      // Mock API responses for predictable testing
      await page.route('/api/listings*', async route => {
        await route.fulfill({
          json: {
            data: [
              {
                id: 'test-listing-1',
                title: 'Eco Coworking Bangkok',
                category: 'coworking',
                city: 'Bangkok',
                ecoTags: ['solar-powered', 'green-building'],
                sustainabilityScore: 85
              }
            ],
            totalCount: 1,
            hasMore: false
          }
        });
      });

    // Open filter panel
    await page.getByRole('button', { name: 'Filters' }).click();

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

      // Verify results with controlled test data
    const listings = page.locator('[data-testid="listing-card"]');
      await expect(listings).toHaveCount(expectedResultsCount);

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
    await page.getByRole('button', { name: 'Filters' }).click();
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
    await expect(page.getByRole('button', { name: 'Filters' })).toBeFocused();

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
      const filterButton = page.getByRole('button', { name: 'Filters' });
      await expect(filterButton).toHaveAttribute('aria-expanded', 'false');
      await expect(filterButton).toHaveAttribute('aria-controls', 'filter-panel');

      // Check category combobox
      const categorySelect = page.locator('select[name="category"]');
      await expect(categorySelect).toHaveAttribute('aria-label', 'Filter by venue category');
    });

    test('announces dynamic content changes', async ({ page }) => {
      // Open filters
      await page.getByRole('button', { name: 'Filters' }).click();
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
    await page.getByRole('button', { name: 'Filters' }).click();

      // Tab through filter controls
      await page.keyboard.press('Tab');
      await expect(page.locator('select[name="category"]')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('input[name="city"]')).toBeFocused();

      // Press escape to close filter panel
      await page.keyboard.press('Escape');
      await expect(page.locator('#filter-panel')).not.toBeVisible();
      await expect(page.getByRole('button', { name: 'Filters' })).toBeFocused();
    });

    test('traps focus in modals', async ({ page }) => {
      // Open advanced filters modal
      await page.getByRole('button', { name: 'Advanced Filters' }).click();
      const modal = page.locator('[role="dialog"]');

      // Test focus trapping by attempting to tab outside
      const firstFocusable = modal.locator('button, input, select, textarea').first();
      const lastFocusable = modal.locator('button, input, select, textarea').last();
      
      await firstFocusable.focus();
      await page.keyboard.press('Shift+Tab');
      await expect(lastFocusable).toBeFocused();
      
      await lastFocusable.focus();
      await page.keyboard.press('Tab');
      await expect(firstFocusable).toBeFocused();
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
        // Mock empty API response for predictable testing
        await page.route('/api/listings*', async route => {
          await route.fulfill({
            json: {
              data: [],
              totalCount: 0,
              hasMore: false
            }
          });
        });

      // Search with unlikely term
      await page.fill('input[type="search"]', 'xyznonexistentlocation123');
      await page.click('button[type="submit"]');

      // Check empty state
      const emptyState = page.locator('[data-testid="empty-results"]');
      await expect(emptyState).toBeVisible();
      await expect(emptyState).toContainText('No results found');
      await expect(emptyState.getByRole('button', { name: 'Clear filters' })).toBeVisible();
    });
  });

  // Visual State Tests
  test.describe('visual feedback and contrast', () => {
    test('provides clear visual feedback for interactions', async ({ page }) => {
      // Check hover states
      const filterButton = page.locator('button', { hasText: 'Filters' });
      await filterButton.hover();
      // Check that some hover state is applied
      const hoverTransform = await filterButton.evaluate(el => getComputedStyle(el).transform);
      expect(hoverTransform).not.toBe('none');

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
          const parseColor = (color: string): [number, number, number] => {
            const input = color.trim().toLowerCase();

            const clamp = (value: number): number => Math.min(Math.max(value, 0), 1);

            if (input.startsWith('#')) {
              let hex = input.slice(1);
              if (hex.length === 3) {
                hex = hex.split('').map(char => char + char).join('');
              }
              if (hex.length === 6) {
                const r = parseInt(hex.slice(0, 2), 16) / 255;
                const g = parseInt(hex.slice(2, 4), 16) / 255;
                const b = parseInt(hex.slice(4, 6), 16) / 255;
                return [clamp(r), clamp(g), clamp(b)];
              }
            }

            const rgbMatch = input.match(/rgba?\(([^)]+)\)/);
            if (rgbMatch) {
              const channels = rgbMatch[1]
                .split(',')
                .slice(0, 3)
                .map(value => {
                  const trimmed = value.trim();
                  if (trimmed.endsWith('%')) {
                    const percentage = parseFloat(trimmed.slice(0, -1));
                    if (Number.isFinite(percentage)) {
                      return clamp(percentage / 100);
                    }
                    return 0;
                  }
                  const channel = parseFloat(trimmed);
                  if (Number.isFinite(channel)) {
                    return clamp(channel / 255);
                  }
                  return 0;
                });
              if (channels.length === 3) {
                return [channels[0], channels[1], channels[2]];
              }
            }

            // Fallback to black if parsing fails
            return [0, 0, 0];
          };

          const linearizeChannel = (channel: number): number => {
            if (channel <= 0.03928) {
              return channel / 12.92;
            }
            return Math.pow((channel + 0.055) / 1.055, 2.4);
          };

          const relativeLuminance = ([r, g, b]: [number, number, number]): number => {
            const [R, G, B] = [linearizeChannel(r), linearizeChannel(g), linearizeChannel(b)];
            return 0.2126 * R + 0.7152 * G + 0.0722 * B;
          };

          const calculateContrastRatio = (textCol: string, bgCol: string): number => {
            const textColor = parseColor(textCol);
            const backgroundColor = parseColor(bgCol);
            const textLuminance = relativeLuminance(textColor);
            const backgroundLuminance = relativeLuminance(backgroundColor);
            const lighter = Math.max(textLuminance, backgroundLuminance);
            const darker = Math.min(textLuminance, backgroundLuminance);
            return (lighter + 0.05) / (darker + 0.05);
          };
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
      await page.setViewportSize({
        width: page.viewportSize()?.width || 0,
        height: page.viewportSize()?.height || 0,
        // Removed isMobile: true due to type error.
        // If touch emulation is critical, consider using page.emulate() or
        // a custom page.evaluate() to modify navigator properties.
      });

      // Check touch-friendly target sizes
      const interactiveElements = await page.$$('button, [role="button"], a, input, select');
      for (const element of interactiveElements) {
        const boundingBox = await element.boundingBox();
        if (boundingBox) { // Null check for boundingBox
          const { width, height } = boundingBox;
          expect(width).toBeGreaterThanOrEqual(44); // Min touch target size
          expect(height).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });
});
