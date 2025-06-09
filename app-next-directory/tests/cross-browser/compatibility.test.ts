import { devices, expect, test } from '@playwright/test';

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
        await page.fill('input[name="search"]', 'coworking');
        await page.click('button[type="submit"]');

        await page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 });

        const results = page.locator('[data-testid="listing-card"]');
        await expect(results.first()).toBeVisible();
      });

      test(`form submission works on ${browserName}`, async ({
        page,
        browserName: actualBrowser,
      }) => {
        test.skip(actualBrowser !== browserName, `This test is for ${browserName} only`);

        await page.goto('/contact');

        await page.fill('input[name="name"]', 'Test User');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('textarea[name="message"]', 'Test message');

        const responsePromise = page.waitForResponse('/api/contact');
        await page.click('button[type="submit"]');

        const response = await responsePromise;
        expect([200, 201]).toContain(response.status());
      });

      test(`navigation works on ${browserName}`, async ({ page, browserName: actualBrowser }) => {
        test.skip(actualBrowser !== browserName, `This test is for ${browserName} only`);

        await page.goto('/');

        // Test navigation links
        await page.click('a[href="/search"]');
        await expect(page).toHaveURL(/.*\/search/);

        await page.click('a[href="/about"]');
        await expect(page).toHaveURL(/.*\/about/);

        await page.click('a[href="/contact"]');
        await expect(page).toHaveURL(/.*\/contact/);
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
              const test = 'test';
              let test2 = 'test2';
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
        expect(supported).toBeTruthy(`${feature} should be supported`);
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
        expect(supported).toBeTruthy(`${feature} should be supported`);
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
      // Simulate mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/listings/sample-coworking-space');

      // Test touch events on image gallery
      const galleryImage = page.locator('[data-testid="gallery-image"]').first();

      // Test tap
      await galleryImage.tap();
      await expect(page.locator('[data-testid="image-modal"]')).toBeVisible();

      // Test swipe gestures (if implemented)
      await page.touchscreen.tap(200, 300);
      await page.touchscreen.tap(100, 300); // Swipe left gesture
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
          webkit_scrollbar: CSS.supports('::-webkit-scrollbar', 'width: 10px'),
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
      await page.goto('/dashboard/create-listing');

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
      await page.goto('/dashboard/create-listing');

      const dropZone = page.locator('[data-testid="file-drop-zone"]');

      if (await dropZone.isVisible()) {
        // Simulate drag and drop
        await dropZone.hover();

        // Create a file and simulate drop
        const fileContent = Buffer.from('test image content');

        await page.evaluate(content => {
          const dropZone = document.querySelector('[data-testid="file-drop-zone"]');
          if (dropZone) {
            const event = new DragEvent('drop', {
              dataTransfer: new DataTransfer(),
            });

            // Add file to dataTransfer
            const file = new File([content], 'test.png', { type: 'image/png' });
            event.dataTransfer?.items.add(file);

            dropZone.dispatchEvent(event);
          }
        }, Array.from(fileContent));
      }
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
        expect(bodyOverflow.scrollWidth).toBeLessThanOrEqual(bodyOverflow.clientWidth + 10);
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
      console.log(`${browserName} load time: ${loadTime}ms`);

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
        console.log(`${browserName} Web Vitals:`, webVitals);
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

      await page.click('a[href="/contact"]');
      await page.waitForLoadState('networkidle');

      // Should not have JavaScript errors
      expect(errors).toHaveLength(0);
    });

    test('network error recovery', async ({ page }) => {
      await page.goto('/search');

      // Simulate network failure
      await page.route('/api/search*', route => {
        route.abort('failed');
      });

      await page.fill('input[name="search"]', 'test');
      await page.click('button[type="submit"]');

      // Should show appropriate error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();

      // Should allow retry
      const retryButton = page.locator('[data-testid="retry-button"]');
      if (await retryButton.isVisible()) {
        await expect(retryButton).toBeEnabled();
      }
    });
  });
});
