import { devices, expect, test } from '@playwright/test';
import { structuredLogger } from '@/lib/logger';

test.describe('Cross-Browser Compatibility Testing', () => {
  test.describe('Core Functionality Across Browsers', () => {
    test('search functionality works', async ({ page }) => {
      await page.goto('/');

      const searchBox = page
        .getByRole('searchbox', { name: /search venues/i })
        .or(page.locator('#hero-search'));

      await expect(searchBox).toBeVisible();
      await searchBox.fill('coworking');

      await Promise.all([
        page.waitForURL(/\/search\?.*\bq=coworking\b/i),
        searchBox.press('Enter'),
      ]);

      await expect(page.getByRole('heading', { name: /search results/i })).toBeVisible();
      await expect(page.locator('main a[href^="/listings/"]').first()).toBeVisible();
    });

    test('form submission works', async ({ page }) => {
      await page.route('**/api/contact', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Thanks! We will be in touch shortly.' }),
        });
      });

      await page.goto('/contact-us');

      await page.getByTestId('contact-name').fill('Test User');
      await page.getByTestId('contact-email').fill('test@example.com');
      await page.getByTestId('contact-subject').fill('Interested in sustainable stays');
      await page.getByTestId('contact-message').fill('Test message about sustainable travel.');

      const responsePromise = page.waitForResponse('**/api/contact');
      await page.getByTestId('contact-submit').click();
      const response = await responsePromise;

      expect(response.status()).toBe(200);
      await expect(page.getByTestId('contact-success')).toBeVisible();
    });

    test('navigation works', async ({ page }) => {
      await page.goto('/');

      const primaryNav = page.getByRole('navigation', { name: /primary navigation/i });

      await Promise.all([
        page.waitForURL(/\/search(?:\?.*)?(?:#.*)?$/),
        primaryNav.getByRole('link', { name: /^search$/i }).click(),
      ]);
      await expect(page).toHaveURL(/\/search(?:\?.*)?(?:#.*)?$/);

      await Promise.all([
        page.waitForURL(/\/blog(?:\?.*)?(?:#.*)?$/),
        primaryNav.getByRole('link', { name: /^blog$/i }).click(),
      ]);
      await expect(page).toHaveURL(/\/blog(?:\?.*)?(?:#.*)?$/);

      await Promise.all([
        page.waitForURL(/\/contact-us\/?(?:\?.*)?(?:#.*)?$/),
        primaryNav.getByRole('link', { name: /contact us/i }).click(),
      ]);
      await expect(page).toHaveURL(/\/contact-us\/?(?:\?.*)?(?:#.*)?$/);
    });
  });

  test.describe('JavaScript Feature Compatibility', () => {
    test('ES6 features compatibility', async ({ page }) => {
      await page.goto('/');

      const jsFeatures = await page.evaluate(() => {
        const features = {
          arrow_functions: (() => true)(),
          const_let: (() => {
            try {
              const test = 'test';
              const test2 = 'test2';
              return true;
            } catch (e) {
              return false;
            }
          })(),
          template_literals: (() => {
            try {
              const test = `template ${1 + 1}`;
              return test === 'template 2';
            } catch (e) {
              return false;
            }
          })(),
          destructuring: (() => {
            try {
              const [a, b] = [1, 2];
              const { x, y } = { x: 1, y: 2 };
              return a === 1 && x === 1;
            } catch (e) {
              return false;
            }
          })(),
          promises: typeof Promise !== 'undefined',
          fetch_api: typeof fetch !== 'undefined',
          local_storage: typeof localStorage !== 'undefined',
          session_storage: typeof sessionStorage !== 'undefined',
        };

        return features;
      });

      // All modern features should be supported
      Object.entries(jsFeatures).forEach(([feature, supported]) => {
        expect(supported).toBeTruthy();
      });
    });

    test('CSS features compatibility', async ({ page }) => {
      await page.goto('/');

      const cssFeatures = await page.evaluate(() => {
        const testDiv = document.createElement('div');
        document.body.appendChild(testDiv);

        const features = {
          flexbox: CSS.supports('display', 'flex'),
          grid: CSS.supports('display', 'grid'),
          css_variables: CSS.supports('color', 'var(--test)'),
          transforms: CSS.supports('transform', 'translateX(10px)'),
          transitions: CSS.supports('transition', 'all 1s'),
          media_queries: window.matchMedia !== undefined,
          viewport_units: CSS.supports('width', '100vw'),
        };

        document.body.removeChild(testDiv);
        return features;
      });

      // All CSS features should be supported
      Object.entries(cssFeatures).forEach(([feature, supported]) => {
        expect(supported).toBeTruthy();
      });
    });
  });

  test.describe('Mobile Browser Compatibility', () => {
    Object.entries(devices).forEach(([deviceName, device]) => {
      if (deviceName.includes('iPhone') || deviceName.includes('Pixel')) {
        test(`mobile functionality on ${deviceName}`, async ({ browser }) => {
          const context = await browser.newContext({
            ...device,
          });
          const page = await context.newPage();

          await page.goto('/');

          // Test touch interactions
          const searchButton = page.locator('button[type="submit"]');
          await searchButton.tap();

          // Test mobile navigation
          const mobileMenuToggle = page.locator('[data-testid="mobile-menu-toggle"]');
          if (await mobileMenuToggle.isVisible()) {
            await mobileMenuToggle.tap();
            const mobileMenu = page.locator('[data-testid="mobile-menu"]');
            await expect(mobileMenu).toBeVisible();
          }

          await context.close();
        });
      }
    });

    test('touch events compatibility', async ({ page }) => {
      test.skip(true, 'Use the touch-enabled browser context test below');
    });

    test('touch events compatibility (touch-enabled context)', async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 375, height: 667 },
        hasTouch: true,
        isMobile: true,
      });
      const page = await context.newPage();

      try {
        await page.goto('/listings/banyan-tree-phuket');

        const firstThumbnail = page.getByTestId('gallery-thumbnail').first();
        await expect(firstThumbnail).toBeVisible();

        await firstThumbnail.tap();
        const lightbox = page.getByTestId('gallery-lightbox');
        await expect(lightbox).toBeVisible();

        await page.getByRole('button', { name: /next image/i }).tap();
        await expect(lightbox).toBeVisible();
      } finally {
        await context.close();
      }
    });
  });

  test.describe('Browser-Specific Feature Tests', () => {
    test('Safari-specific functionality', async ({ page, browserName }) => {
      test.skip(browserName !== 'webkit', 'This test is for Safari/WebKit only');

      await page.goto('/');

      // Test Safari-specific features
      const safariFeatures = await page.evaluate(() => {
        return {
          webkit_appearance: CSS.supports('-webkit-appearance', 'none'),
          webkit_transform: CSS.supports('-webkit-transform', 'translateX(10px)'),
          touch_callout: CSS.supports('-webkit-touch-callout', 'none'),
          user_select: CSS.supports('-webkit-user-select', 'none'),
        };
      });

      // Safari-specific CSS properties should work
      expect(safariFeatures.webkit_appearance).toBeTruthy();
    });

    test('Firefox-specific functionality', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox', 'This test is for Firefox only');

      await page.goto('/');

      // Test Firefox-specific features
      const firefoxFeatures = await page.evaluate(() => {
        return {
          moz_appearance: CSS.supports('-moz-appearance', 'none'),
          moz_user_select: CSS.supports('-moz-user-select', 'none'),
          scrollbar_width: CSS.supports('scrollbar-width', 'thin'),
        };
      });

      // Firefox-specific CSS properties should work
      expect(firefoxFeatures.scrollbar_width).toBeTruthy();
    });

    test('Chrome-specific functionality', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'This test is for Chrome/Chromium only');

      await page.goto('/');

      // Test Chrome-specific features
      const chromeFeatures = await page.evaluate(() => {
        return {
          webkit_scrollbar: (() => {
            try {
              const style = document.createElement('style');
              style.textContent = '::-webkit-scrollbar { width: 10px; }';
              return true;
            } catch (e) {
              return false;
            }
          })(),
          webkit_mask: CSS.supports('-webkit-mask', 'none'),
          chrome_available: 'chrome' in window,
        };
      });

      // Chrome-specific features should work
      expect(chromeFeatures.webkit_mask).toBeTruthy();
    });
  });

  test.describe('File Upload Compatibility', () => {
    test('file upload works across browsers', async ({ page }) => {
      await page.goto('/test/file-upload');

      // Create test file
      const fileContent =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test-image.png',
        mimeType: 'image/png',
        buffer: Buffer.from(fileContent.split(',')[1], 'base64'),
      });

      // Verify file was selected
      const selectedFile = await fileInput.evaluate((input: HTMLInputElement) => {
        return input.files?.[0]?.name;
      });

      expect(selectedFile).toBe('test-image.png');
    });

    test('drag and drop file upload', async ({ page }) => {
      await page.goto('/test/file-upload');

      const dropZone = page.locator('[data-testid="file-drop-zone"]');

      // Assert that the drop zone is visible before proceeding.
      // This will fail the test if the element is not present.
      await expect(dropZone, 'The file drop zone should be visible.').toBeVisible();

      // Create a file and simulate the drop event inside the browser context
      const fileContent = Buffer.from('test image content');
      await page.evaluate(content => {
        const dropZoneEl = document.querySelector('[data-testid="file-drop-zone"]');
        if (dropZoneEl) {
          const dataTransfer = new DataTransfer();
          const file = new File([new Uint8Array(content)], 'test.png', { type: 'image/png' });
          dataTransfer.items.add(file);

          const event = new DragEvent('drop', {
            bubbles: true,
            cancelable: true,
            dataTransfer: dataTransfer,
          });

          dropZoneEl.dispatchEvent(event);
        }
      }, Array.from(fileContent));

      // Verify the file was "uploaded" by checking for its name in the UI.
      await expect(page.locator('text=test.png')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Responsive Design Compatibility', () => {
    const viewports = [
      { name: 'Mobile Portrait', width: 375, height: 667 },
      { name: 'Mobile Landscape', width: 667, height: 375 },
      { name: 'Tablet Portrait', width: 768, height: 1024 },
      { name: 'Tablet Landscape', width: 1024, height: 768 },
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Large Desktop', width: 2560, height: 1440 },
    ];

    viewports.forEach(viewport => {
      test(`responsive layout on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/');

        // Check that layout adapts properly
        const header = page.locator('header');
        const navigation = page.locator('nav');
        const mainContent = page.locator('main');

        await expect(header).toBeVisible();
        await expect(mainContent).toBeVisible();

        // Navigation might be hidden on mobile
        if (viewport.width >= 768) {
          await expect(navigation).toBeVisible();
        }

        // Check that content doesn't overflow
        const bodyOverflow = await page.evaluate(() => {
          return {
            overflowX: window.getComputedStyle(document.body).overflowX,
            scrollWidth: document.body.scrollWidth,
            clientWidth: document.body.clientWidth,
          };
        });

        // Should not have horizontal overflow
        expect(bodyOverflow.scrollWidth).toBeLessThanOrEqual(bodyOverflow.clientWidth + 40);
      });
    });
  });

  test.describe('Performance Across Browsers', () => {
    test('page load performance comparison', async ({ page, browserName }) => {
      const startTime = Date.now();

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Log performance for different browsers
      structuredLogger.debug(`${browserName} load time: ${loadTime}ms`);

      // All browsers should load within reasonable time
      expect(loadTime).toBeLessThan(5000);

      // Check Core Web Vitals
      const webVitals = await page.evaluate(() => {
        return new Promise(resolve => {
          if ('performance' in window) {
            const navigation = performance.getEntriesByType(
              'navigation'
            )[0] as PerformanceNavigationTiming;
            resolve({
              browserName: navigator.userAgent,
              domContentLoaded:
                navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
              loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            });
          }
          resolve(null);
        });
      });

      if (webVitals) {
        structuredLogger.debug(`${browserName} Web Vitals:`, { webVitals });
      }
    });
  });

  test.describe('Error Handling Across Browsers', () => {
    test('JavaScript error handling', async ({ page }) => {
      const errors: string[] = [];

      page.on('pageerror', error => {
        errors.push(error.message);
      });

      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto('/');

      // Navigate through key pages
      await page.click('a[href="/search"]');
      await page.waitForLoadState('networkidle');

      await page.click('a[href="/contact-us"]');
      await page.waitForLoadState('networkidle');

      // Should not have JavaScript errors
      expect(errors).toHaveLength(0);
    });

    test('network error recovery', async ({ page }) => {
      await page.goto('/search?e2eScenario=fail-once&q=coworking');

      const errorState = page.getByTestId('search-error-state');
      await expect(errorState).toBeVisible();

      const retryButton = page.getByTestId('search-retry-button');
      await expect(retryButton).toBeVisible();

      await Promise.all([page.waitForURL(/retry=1/), retryButton.click()]);

      await expect(page.getByRole('heading', { name: /search results/i })).toBeVisible();
      await expect(page.locator('main a[href^="/listings/"]').first()).toBeVisible();
    });
  });
});
