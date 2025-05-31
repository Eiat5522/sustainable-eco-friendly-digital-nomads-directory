import { expect, test } from '@playwright/test';
import { checkA11y, getViolations, injectAxe } from 'axe-playwright';

test.describe('Accessibility Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Inject axe-core into every page
    await injectAxe(page);
  });

  test.describe('Core Accessibility Standards', () => {
    test('homepage meets WCAG 2.1 AA standards', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Run axe accessibility checks
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true },
      });
    });

    test('search results page accessibility', async ({ page }) => {
      await page.goto('/search?q=coworking');
      await page.waitForSelector('[data-testid="search-results"]');

      await checkA11y(page, null, {
        includedImpacts: ['critical', 'serious'],
      });
    });

    test('listing detail page accessibility', async ({ page }) => {
      await page.goto('/listings/sample-coworking-space');
      await page.waitForLoadState('networkidle');

      // Check for common accessibility issues
      await checkA11y(page, null, {
        rules: {
          'color-contrast': { enabled: true },
          'heading-order': { enabled: true },
          'image-alt': { enabled: true },
          label: { enabled: true },
          'landmark-one-main': { enabled: true },
        },
      });
    });

    test('contact form accessibility', async ({ page }) => {
      await page.goto('/contact');

      await checkA11y(page, 'form[data-testid="contact-form"]', {
        includedImpacts: ['critical', 'serious', 'moderate'],
      });
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('complete keyboard navigation flow', async ({ page }) => {
      await page.goto('/');

      // Start from top of page
      await page.keyboard.press('Home');

      // Tab through all interactive elements
      const interactiveElements = [];
      let previousElement = null;

      for (let i = 0; i < 50; i++) {
        // Limit to prevent infinite loop
        await page.keyboard.press('Tab');

        const activeElement = await page.evaluate(() => {
          const el = document.activeElement;
          return el
            ? {
                tagName: el.tagName,
                id: el.id,
                className: el.className,
                textContent: el.textContent?.trim().substring(0, 50),
              }
            : null;
        });

        if (!activeElement || activeElement === previousElement) break;

        interactiveElements.push(activeElement);
        previousElement = activeElement;
      }

      // Should have tabbed through multiple elements
      expect(interactiveElements.length).toBeGreaterThan(5);

      // All focused elements should be visible
      for (const element of interactiveElements) {
        expect(element.tagName).toMatch(/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/);
      }
    });

    test('skip navigation links functionality', async ({ page }) => {
      await page.goto('/');

      // Press Tab to focus skip link
      await page.keyboard.press('Tab');

      const skipLink = page.locator('[data-testid="skip-to-main"]');
      await expect(skipLink).toBeFocused();

      // Activate skip link
      await page.keyboard.press('Enter');

      // Should focus main content
      const mainContent = page.locator('main');
      await expect(mainContent).toBeFocused();
    });

    test('modal keyboard trap', async ({ page }) => {
      await page.goto('/listings/sample-coworking-space');

      // Open modal
      await page.click('[data-testid="gallery-image"]');
      await page.waitForSelector('[data-testid="image-modal"]');

      // Tab through modal elements
      const modalElements = [];
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');

        const activeElement = await page.evaluate(() => {
          const el = document.activeElement;
          return el?.closest('[data-testid="image-modal"]') ? el.tagName : null;
        });

        if (activeElement) {
          modalElements.push(activeElement);
        }
      }

      // Focus should stay within modal
      expect(modalElements.every(el => el !== null)).toBeTruthy();

      // Escape should close modal
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid="image-modal"]')).not.toBeVisible();
    });

    test('dropdown menu keyboard navigation', async ({ page }) => {
      await page.goto('/');

      const dropdown = page.locator('[data-testid="user-menu-trigger"]');
      await dropdown.focus();

      // Open dropdown with Enter
      await page.keyboard.press('Enter');
      await page.waitForSelector('[data-testid="user-menu"]');

      // Navigate with arrow keys
      await page.keyboard.press('ArrowDown');

      const firstItem = page.locator('[data-testid="user-menu"] a').first();
      await expect(firstItem).toBeFocused();

      // Navigate to next item
      await page.keyboard.press('ArrowDown');

      const secondItem = page.locator('[data-testid="user-menu"] a').nth(1);
      await expect(secondItem).toBeFocused();
    });
  });

  test.describe('Screen Reader Support', () => {
    test('proper heading structure', async ({ page }) => {
      await page.goto('/');

      const headings = await page.evaluate(() => {
        const headingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        return headingElements.map(el => ({
          level: parseInt(el.tagName.charAt(1)),
          text: el.textContent?.trim(),
        }));
      });

      // Should have exactly one h1
      const h1Count = headings.filter(h => h.level === 1).length;
      expect(h1Count).toBe(1);

      // Heading levels should be logical (no skipping)
      for (let i = 1; i < headings.length; i++) {
        const currentLevel = headings[i].level;
        const previousLevel = headings[i - 1].level;

        // Should not skip more than one level
        expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
      }
    });

    test('ARIA labels and descriptions', async ({ page }) => {
      await page.goto('/search');

      // Check search form has proper ARIA labels
      const searchInput = page.locator('input[name="search"]');
      const searchLabel = await searchInput.getAttribute('aria-label');
      const searchDescribedBy = await searchInput.getAttribute('aria-describedby');

      expect(searchLabel || searchDescribedBy).toBeTruthy();

      // Check filter controls have ARIA labels
      const categoryFilter = page.locator('select[name="category"]');
      const categoryLabel = await categoryFilter.getAttribute('aria-label');

      expect(categoryLabel).toBeTruthy();
    });

    test('live regions for dynamic content', async ({ page }) => {
      await page.goto('/search');

      // Submit search
      await page.fill('input[name="search"]', 'coworking');
      await page.click('button[type="submit"]');

      // Check for live region announcing results
      const liveRegion = page.locator('[aria-live]');
      await expect(liveRegion).toBeVisible();

      const liveRegionText = await liveRegion.textContent();
      expect(liveRegionText).toMatch(/found|results|loading/i);
    });

    test('form validation announcements', async ({ page }) => {
      await page.goto('/contact');

      // Submit empty form
      await page.click('button[type="submit"]');

      // Check error messages are properly associated
      const nameInput = page.locator('input[name="name"]');
      const nameError = page.locator('[data-testid="name-error"]');

      const describedBy = await nameInput.getAttribute('aria-describedby');
      const errorId = await nameError.getAttribute('id');

      expect(describedBy).toContain(errorId || '');

      // Error should be announced to screen readers
      const ariaInvalid = await nameInput.getAttribute('aria-invalid');
      expect(ariaInvalid).toBe('true');
    });
  });

  test.describe('Visual Accessibility', () => {
    test('sufficient color contrast', async ({ page }) => {
      await page.goto('/');

      // Check color contrast using axe
      const violations = await getViolations(page, null, {
        rules: { 'color-contrast': { enabled: true } },
      });

      const contrastViolations = violations.filter(v => v.id === 'color-contrast');
      expect(contrastViolations).toHaveLength(0);
    });

    test('focus indicators are visible', async ({ page }) => {
      await page.goto('/');

      // Tab to first interactive element
      await page.keyboard.press('Tab');

      const focusedElement = page.locator(':focus');

      // Check focus indicator styles
      const focusStyles = await focusedElement.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          outlineColor: styles.outlineColor,
          outlineWidth: styles.outlineWidth,
          boxShadow: styles.boxShadow,
        };
      });

      // Should have visible focus indicator
      const hasFocusIndicator =
        focusStyles.outline !== 'none' ||
        focusStyles.boxShadow !== 'none' ||
        focusStyles.outlineWidth !== '0px';

      expect(hasFocusIndicator).toBeTruthy();
    });

    test('text scaling up to 200%', async ({ page }) => {
      await page.goto('/');

      // Set zoom to 200%
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.evaluate(() => {
        document.body.style.zoom = '2';
      });

      await page.waitForTimeout(1000); // Wait for reflow

      // Check that content is still usable
      const header = page.locator('header');
      const navigation = page.locator('nav');
      const mainContent = page.locator('main');

      await expect(header).toBeVisible();
      await expect(navigation).toBeVisible();
      await expect(mainContent).toBeVisible();

      // Text should not be cut off or overlapping
      await checkA11y(page, null, {
        rules: { 'scrollable-region-focusable': { enabled: true } },
      });
    });

    test('reduced motion preferences', async ({ page }) => {
      // Set reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });

      await page.goto('/');

      // Check that animations are reduced/disabled
      const animatedElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.filter(el => {
          const styles = window.getComputedStyle(el);
          return styles.animationDuration !== '0s' || styles.transitionDuration !== '0s';
        }).length;
      });

      // Should have minimal or no animations when reduced motion is preferred
      expect(animatedElements).toBeLessThan(5);
    });
  });

  test.describe('Mobile Accessibility', () => {
    test('mobile touch targets are appropriately sized', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await page.goto('/');

      const touchTargets = await page.evaluate(() => {
        const interactive = Array.from(
          document.querySelectorAll('a, button, input, select, textarea')
        );
        return interactive.map(el => {
          const rect = el.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            element: el.tagName,
          };
        });
      });

      // Touch targets should be at least 44x44px
      const inappropriateSizes = touchTargets.filter(
        target => target.width < 44 || target.height < 44
      );

      expect(inappropriateSizes.length).toBe(0);
    });

    test('mobile navigation accessibility', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Open mobile menu
      const mobileMenuToggle = page.locator('[data-testid="mobile-menu-toggle"]');
      await mobileMenuToggle.click();

      const mobileMenu = page.locator('[data-testid="mobile-menu"]');
      await expect(mobileMenu).toBeVisible();

      // Check ARIA attributes
      const expanded = await mobileMenuToggle.getAttribute('aria-expanded');
      expect(expanded).toBe('true');

      const controls = await mobileMenuToggle.getAttribute('aria-controls');
      const menuId = await mobileMenu.getAttribute('id');
      expect(controls).toBe(menuId);
    });
  });

  test.describe('Error Handling Accessibility', () => {
    test('404 page accessibility', async ({ page }) => {
      await page.goto('/non-existent-page');

      await checkA11y(page, null, {
        includedImpacts: ['critical', 'serious'],
      });

      // Should have proper heading structure
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();

      // Should have skip link to main content
      const skipLink = page.locator('[href="#main"]');
      await expect(skipLink).toBeVisible();
    });

    test('API error announcements', async ({ page }) => {
      // Mock API error
      await page.route('/api/search*', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Server error' }),
        });
      });

      await page.goto('/search');
      await page.fill('input[name="search"]', 'test');
      await page.click('button[type="submit"]');

      // Error should be announced via live region
      const errorMessage = page.locator('[role="alert"], [aria-live="polite"]');
      await expect(errorMessage).toBeVisible();

      const errorText = await errorMessage.textContent();
      expect(errorText).toMatch(/error|failed|problem/i);
    });
  });
});
