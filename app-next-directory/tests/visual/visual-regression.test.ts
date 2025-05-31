import { expect, test } from '@playwright/test';

test.describe('Visual Regression Testing', () => {
  test.describe('Page Screenshots', () => {
    test('homepage visual consistency', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Wait for any animations to complete
      await page.waitForTimeout(1000);

      // Take full page screenshot
      await expect(page).toHaveScreenshot('homepage-full.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('search results page visual consistency', async ({ page }) => {
      await page.goto('/search?q=coworking&city=Bangkok');
      await page.waitForSelector('[data-testid="search-results"]');
      await page.waitForLoadState('networkidle');

      // Take screenshot of search results
      await expect(page).toHaveScreenshot('search-results.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('listing detail page visual consistency', async ({ page }) => {
      await page.goto('/listings/sample-coworking-space');
      await page.waitForLoadState('networkidle');

      // Wait for images to load
      await page.waitForSelector('img[src*="coworking"]', { timeout: 5000 });

      await expect(page).toHaveScreenshot('listing-detail.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('dashboard page visual consistency', async ({ page }) => {
      // Login first
      await page.goto('/auth/signin');
      await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'user@example.com');
      await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');

      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('dashboard.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('Component Screenshots', () => {
    test('header component visual consistency', async ({ page }) => {
      await page.goto('/');

      const header = page.locator('header');
      await expect(header).toHaveScreenshot('header-component.png');
    });

    test('search form component visual consistency', async ({ page }) => {
      await page.goto('/');

      const searchForm = page.locator('[data-testid="search-form"]');
      await expect(searchForm).toHaveScreenshot('search-form.png');
    });

    test('listing card component visual consistency', async ({ page }) => {
      await page.goto('/search?q=coworking');
      await page.waitForSelector('[data-testid="listing-card"]');

      const firstCard = page.locator('[data-testid="listing-card"]').first();
      await expect(firstCard).toHaveScreenshot('listing-card.png');
    });

    test('contact form visual consistency', async ({ page }) => {
      await page.goto('/contact');

      const contactForm = page.locator('form[data-testid="contact-form"]');
      await expect(contactForm).toHaveScreenshot('contact-form.png');
    });

    test('footer component visual consistency', async ({ page }) => {
      await page.goto('/');

      const footer = page.locator('footer');
      await expect(footer).toHaveScreenshot('footer-component.png');
    });
  });

  test.describe('Responsive Design Screenshots', () => {
    test('mobile homepage visual consistency', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('homepage-mobile.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('tablet search results visual consistency', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      await page.goto('/search?q=coworking');
      await page.waitForSelector('[data-testid="search-results"]');

      await expect(page).toHaveScreenshot('search-results-tablet.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('desktop listing detail visual consistency', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
      await page.goto('/listings/sample-coworking-space');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('listing-detail-desktop.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('Interactive State Screenshots', () => {
    test('form validation states visual consistency', async ({ page }) => {
      await page.goto('/contact');

      // Submit empty form to trigger validation
      await page.click('button[type="submit"]');
      await page.waitForSelector('[data-testid="error-message"]');

      const form = page.locator('form[data-testid="contact-form"]');
      await expect(form).toHaveScreenshot('contact-form-errors.png');
    });

    test('search results loading state', async ({ page }) => {
      await page.goto('/search');

      // Intercept search API to delay response
      await page.route('/api/search*', async route => {
        await page.waitForTimeout(2000); // Delay to capture loading state
        route.continue();
      });

      // Trigger search
      await page.fill('input[name="search"]', 'coworking');
      await page.click('button[type="submit"]');

      // Capture loading state
      await page.waitForSelector('[data-testid="loading-spinner"]');
      await expect(page.locator('[data-testid="search-container"]')).toHaveScreenshot(
        'search-loading.png'
      );
    });

    test('hover states visual consistency', async ({ page }) => {
      await page.goto('/search?q=coworking');
      await page.waitForSelector('[data-testid="listing-card"]');

      const firstCard = page.locator('[data-testid="listing-card"]').first();

      // Hover over card
      await firstCard.hover();
      await page.waitForTimeout(300); // Wait for hover animation

      await expect(firstCard).toHaveScreenshot('listing-card-hover.png');
    });

    test('modal visual consistency', async ({ page }) => {
      await page.goto('/listings/sample-coworking-space');

      // Open image gallery modal
      await page.click('[data-testid="gallery-image"]');
      await page.waitForSelector('[data-testid="image-modal"]');

      const modal = page.locator('[data-testid="image-modal"]');
      await expect(modal).toHaveScreenshot('image-modal.png');
    });
  });

  test.describe('Theme and Color Scheme Tests', () => {
    test('dark mode visual consistency', async ({ page }) => {
      await page.goto('/');

      // Toggle dark mode
      await page.click('[data-testid="theme-toggle"]');
      await page.waitForTimeout(500); // Wait for theme transition

      await expect(page).toHaveScreenshot('homepage-dark-mode.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('high contrast mode visual consistency', async ({ page }) => {
      await page.goto('/');

      // Simulate high contrast preference
      await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });

      // Apply high contrast styles
      await page.addStyleTag({
        content: `
          * {
            filter: contrast(150%) !important;
          }
        `,
      });

      await expect(page).toHaveScreenshot('homepage-high-contrast.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('Cross-Browser Visual Consistency', () => {
    test('Chromium vs Firefox comparison', async ({ page, browserName }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Take screenshot with browser name in filename
      await expect(page).toHaveScreenshot(`homepage-${browserName}.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('Safari-specific visual elements', async ({ page, browserName }) => {
      // Skip if not Safari/WebKit
      test.skip(browserName !== 'webkit', 'This test only runs on Safari/WebKit');

      await page.goto('/contact');

      // Safari has specific form styling
      const form = page.locator('form[data-testid="contact-form"]');
      await expect(form).toHaveScreenshot('contact-form-safari.png');
    });
  });

  test.describe('Performance Impact Screenshots', () => {
    test('image loading progression', async ({ page }) => {
      await page.goto('/listings/image-heavy-listing');

      // Capture before images load
      await expect(page).toHaveScreenshot('listing-before-images.png', {
        animations: 'disabled',
      });

      // Wait for images to load
      await page.waitForLoadState('networkidle');

      // Capture after images load
      await expect(page).toHaveScreenshot('listing-after-images.png', {
        animations: 'disabled',
      });
    });

    test('skeleton loading states', async ({ page }) => {
      await page.goto('/search');

      // Intercept API to show skeleton longer
      await page.route('/api/search*', async route => {
        await page.waitForTimeout(3000);
        route.continue();
      });

      await page.fill('input[name="search"]', 'coworking');
      await page.click('button[type="submit"]');

      // Capture skeleton loading
      await page.waitForSelector('[data-testid="skeleton-loader"]');
      await expect(page.locator('[data-testid="search-results"]')).toHaveScreenshot(
        'skeleton-loading.png'
      );
    });
  });
});
