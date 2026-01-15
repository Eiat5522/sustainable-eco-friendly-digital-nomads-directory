import { devices, expect, test } from '@playwright/test';
import { structuredLogger } from '@/src/lib/logger';
import { loginAs } from '../helpers/auth';

test.describe('Cross-Browser Compatibility Testing', () => {
  test.describe('Core Functionality Across Browsers', () => {
    ['chromium', 'firefox', 'webkit'].forEach(browserName => {
      test(`search functionality works on ${browserName}`, async ({
        page,
        browserName: actualBrowser,
      }) => {
        test.skip(actualBrowser !== browserName, `This test is for ${browserName} only`);

        await page.goto('/');

        // Search functionality
        await page.getByLabel('Search venues').fill('coworking');
        await page.getByRole('button', { name: 'Search' }).click();

        await page.waitForURL('**/search**', { timeout: 20000, waitUntil: 'domcontentloaded' });

        await expect(page.getByRole('heading', { name: 'Search Results' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Green Cowork Bangkok' })).toBeVisible();
      });

      test(`form submission works on ${browserName}`, async ({
        page,
        browserName: actualBrowser,
      }) => {
        test.skip(actualBrowser !== browserName, `This test is for ${browserName} only`);

        await page.goto('/contact-us');

        await page.route('**/api/contact', route => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Thanks for reaching out!' }),
          });
        });

        await page.getByTestId('contact-name').fill('Test User');
        await page.getByTestId('contact-email').fill('test@example.com');
        await page.getByTestId('contact-subject').fill('Interested in sustainable stays');
        await page.getByTestId('contact-message').fill('Test message about sustainable travel.');

        await page.getByTestId('contact-submit').click();

        await expect(page.getByTestId('contact-success')).toBeVisible();
      });

      test(`navigation works on ${browserName}`, async ({ page, browserName: actualBrowser }) => {
        test.skip(actualBrowser !== browserName, `This test is for ${browserName} only`);

        await page.goto('/');
        await page.waitForLoadState('networkidle'); // Ensure initial page load is complete

        // Test navigation links
        const primaryNav = page.getByRole('navigation', { name: 'Primary navigation' });
        await expect(primaryNav).toBeVisible();

        // Explicitly wait for the link to be actionable before clicking
        await primaryNav
          .getByRole('link', { name: 'Search' })
          .waitFor({ state: 'visible', timeout: 10000 });
        await primaryNav.getByRole('link', { name: 'Search' }).click();
        await page.waitForURL(/.*\/search/, { timeout: 20000, waitUntil: 'domcontentloaded' });

        const searchNav = page.getByRole('navigation', { name: 'Primary navigation' });
        // Explicitly wait for the link to be actionable before clicking
        await searchNav
          .getByRole('link', { name: 'Blog' })
          .waitFor({ state: 'visible', timeout: 10000 });
        await searchNav.getByRole('link', { name: 'Blog' }).click();
        await page.waitForURL(/.*\/blog/, { timeout: 20000, waitUntil: 'domcontentloaded' });

        const blogNav = page.getByRole('navigation', { name: 'Primary navigation' });
        // Explicitly wait for the link to be actionable before clicking
        await blogNav
          .getByRole('link', { name: 'Contact Us' })
          .waitFor({ state: 'visible', timeout: 10000 });
        await blogNav.getByRole('link', { name: 'Contact Us' }).click();
        await page.waitForURL(/\/contact-us\/?(?:\?.*)?(?:#.*)?$/, {
          timeout: 20000,
          waitUntil: 'domcontentloaded',
        });
      });
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
              const _test = 'test';
              const _test2 = 'test2';
              return true;
            } catch (_e) {
              return false;
            }
          })(),
          template_literals: (() => {
            try {
              const test = `template ${1 + 1}`;
              return test === 'template 2';
            } catch (_e) {
              return false;
            }
          })(),
          destructuring: (() => {
            try {
              const [a, _b] = [1, 2];
              const { x } = { x: 1, y: 2 };
              return a === 1 && x === 1;
            } catch (_e) {
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
        expect(supported, `JS feature '${feature}' should be supported`).toBeTruthy();
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
        expect(supported, `CSS feature '${feature}' should be supported`).toBeTruthy();
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

          const mobileMenuToggle = page.locator('[data-testid="mobile-menu-toggle"]');
          if (await mobileMenuToggle.isVisible()) {
            // Use click instead of tap and wait for the menu to appear
            await page.screenshot({
              path: test.info().outputPath(`${deviceName}-before-menu-toggle.png`),
            });
            await mobileMenuToggle.click();
            const mobileMenu = page.locator('[data-testid="mobile-menu"]');
            // Wait for the mobile menu to become visible, checking its computed style
            const menuHandle = await mobileMenu.elementHandle();
            await page.waitForFunction(
              menu => {
                const style = window.getComputedStyle(menu);
                return style.visibility !== 'hidden' && style.opacity !== '0';
              },
              menuHandle,
              { timeout: 10000 }
            );
            await expect(mobileMenu).toBeVisible();
            await page.screenshot({
              path: test.info().outputPath(`${deviceName}-after-menu-toggle.png`),
            });

            // Now click the 'Search' link within the mobile menu
            await mobileMenu.getByRole('link', { name: 'Search' }).click();
            await page.waitForURL(/.*\/search/, { timeout: 20000, waitUntil: 'domcontentloaded' });
            // Verify that the mobile menu closes after navigation
            await mobileMenu.waitFor({ state: 'hidden', timeout: 10000 }); // Explicitly wait for hidden state
            await expect(mobileMenu).not.toBeVisible();
          }

          // Search functionality (now on the search page)
          await page.waitForLoadState('networkidle');
          await page.locator('#search-page-input').waitFor({ state: 'visible', timeout: 10000 }); // Explicitly wait for search input
          await page.locator('#search-page-input').fill('coworking');
          await page.getByRole('button', { name: 'Search' }).click();

          await page.waitForURL('**/search**', { timeout: 20000, waitUntil: 'domcontentloaded' });

          await context.close();
        });
      }
    });

    test('touch events compatibility', async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 375, height: 667 },
        hasTouch: true,
      });
      const page = await context.newPage();

      await page.goto('/listings/banyan-tree-phuket');

      const galleryImage = page.getByTestId('gallery-thumbnail').first();
      await galleryImage.tap();
      await expect(page.getByTestId('gallery-lightbox')).toBeVisible();

      await context.close();
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
            } catch (_e) {
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
    test.beforeEach(async ({ page }) => {
      await loginAs(
        page,
        process.env.E2E_VENUE_OWNER_EMAIL ?? 'venue@example.com',
        process.env.E2E_VENUE_OWNER_PASSWORD ?? 'TestSecurePass123!'
      );
    });

    test('file upload works across browsers', async ({ page }) => {
      await page.goto('/dashboard/listings/new', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForURL(/\/dashboard\/listings\/new/, {
        timeout: 15000,
        waitUntil: 'domcontentloaded',
      });
      await expect(page.getByRole('heading', { name: 'Add New Listing' })).toBeVisible();
      await page.waitForSelector('input[type="file"]', { state: 'attached' });

      // Create test file
      const fileContent =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const fileInput = page.locator('input[type="file"]').first();
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
      await page.goto('/dashboard/listings/new', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
      await page.waitForURL(/\/dashboard\/listings\/new/, {
        timeout: 15000,
        waitUntil: 'domcontentloaded',
      });
      await expect(page.getByRole('heading', { name: 'Add New Listing' })).toBeVisible();
      await page.waitForSelector('input[type="file"]', { state: 'attached' });

      const fileInput = page.locator('input[type="file"]').nth(1);

      await fileInput.setInputFiles([
        {
          name: 'gallery-1.png',
          mimeType: 'image/png',
          buffer: Buffer.from('test image content'),
        },
        {
          name: 'gallery-2.png',
          mimeType: 'image/png',
          buffer: Buffer.from('another test image content'),
        },
      ]);

      const selectedFiles = await fileInput.evaluate((input: HTMLInputElement) => {
        return Array.from(input.files ?? []).map(file => file.name);
      });

      expect(selectedFiles).toEqual(['gallery-1.png', 'gallery-2.png']);
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
        expect(bodyOverflow.scrollWidth).toBeLessThanOrEqual(bodyOverflow.clientWidth + 30);
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
      expect(loadTime).toBeLessThan(20000);

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
        if (msg.type() !== 'error') return;
        const message = msg.text();
        if (message.includes('Failed to load resource')) return;
        errors.push(message);
      });

      await page.route('**/api/auth/session', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'null',
        });
      });

      await page.goto('/');

      // Navigate through key pages
      const primaryNav = page.getByRole('navigation', { name: 'Primary navigation' });
      await expect(primaryNav).toBeVisible();

      await primaryNav.getByRole('link', { name: 'Search' }).click();
      await page.waitForLoadState('networkidle');

      await primaryNav.getByRole('link', { name: 'Contact Us' }).click();
      await page.waitForLoadState('networkidle');

      const filteredErrors = errors.filter(error => !error.includes('Minified React error #418'));

      // Should not have JavaScript errors
      expect(filteredErrors).toHaveLength(0);
    });

    test('network error recovery', async ({ page }) => {
      await page.goto('/search?e2eScenario=fail-once');

      await expect(page.getByTestId('search-error-state')).toBeVisible();

      const retryButton = page.getByTestId('search-retry-button');
      await expect(retryButton).toBeVisible({ timeout: 5000 });
    });
  });
});
