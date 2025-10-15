import { expect, test } from '@playwright/test';

test.describe('Performance & Load Testing', () => {
  test.describe('Page Load Performance', () => {
    test('home page loads within acceptable time limits', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/');

      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Page should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);

      // Check Core Web Vitals
      const performanceMetrics = await page.evaluate(() => {
        return new Promise(resolve => {
          if ('performance' in window) {
            const navigation = performance.getEntriesByType(
              'navigation'
            )[0] as PerformanceNavigationTiming;
            resolve({
              domContentLoaded:
                navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
              loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
              firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
              firstContentfulPaint:
                performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
            });
          }
          resolve(null);
        });
      });

      if (performanceMetrics) {
        console.log('Performance Metrics:', performanceMetrics);
      }
    });

    test('search results page performance under load', async ({ page }) => {
      // Simulate multiple rapid searches
      const searchQueries = ['bangkok', 'coworking', 'sustainable', 'nomad', 'eco'];

      for (const query of searchQueries) {
        const startTime = Date.now();

        await page.goto(`/search?q=${query}`);
        await page.waitForSelector('[data-testid="search-results"]');

        const searchTime = Date.now() - startTime;

        // Search should complete within 2 seconds
        expect(searchTime).toBeLessThan(2000);
      }
    });

    test('listing detail page caching performance', async ({ page }) => {
      const listingSlug = 'test-eco-coworking-space';

      // First visit (cache miss)
      const firstVisitStart = Date.now();
      await page.goto(`/listings/${listingSlug}`);
      await page.waitForLoadState('networkidle');
      const firstVisitTime = Date.now() - firstVisitStart;

      // Second visit (cache hit)
      const secondVisitStart = Date.now();
      await page.goto(`/listings/${listingSlug}`);
      await page.waitForLoadState('networkidle');
      const secondVisitTime = Date.now() - secondVisitStart;

      // Cached visit should be significantly faster
      expect(secondVisitTime).toBeLessThan(firstVisitTime * 0.7);
    });
  });

  test.describe('API Performance', () => {
    test('listings API response time under concurrent requests', async ({ request }) => {
      const concurrentRequests = 10;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request.get('/api/listings').then(response => ({
            status: response.status(),
            time: Date.now(),
          }))
        );
      }

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      results.forEach(result => {
        expect(result.status).toBe(200);
      });

      // All concurrent requests should complete within 5 seconds
      expect(totalTime).toBeLessThan(5000);
    });

    test('search API performance with complex filters', async ({ request }) => {
      const complexQuery = {
        q: 'coworking',
        category: 'coworking',
        city: 'Bangkok',
        minPrice: 100,
        maxPrice: 500,
        amenities: 'wifi,coffee,parking',
        sortBy: 'price',
        sortOrder: 'asc',
        page: 1,
        limit: 20,
      };

      const startTime = Date.now();
      const response = await request.get('/api/search', {
        params: complexQuery,
      });
      const responseTime = Date.now() - startTime;

      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(1500); // Complex search within 1.5 seconds
    });
  });

  test.describe('Memory & Resource Usage', () => {
    test('image gallery memory usage', async ({ page }) => {
      await page.goto('/listings/test-listing-with-many-images');

      // Monitor memory usage during image loading
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      // Scroll through image gallery to trigger lazy loading
      await page.locator('[data-testid="image-gallery"]').evaluate((el: HTMLElement) => el.scrollIntoView());
      await page.waitForTimeout(2000); // Allow images to load

      const afterImagesMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      // Memory increase should be reasonable (less than 50MB)
      const memoryIncrease = afterImagesMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    test('infinite scroll performance', async ({ page }) => {
      await page.goto('/listings');

      let itemCount = 0;
      const maxScrolls = 10;

      for (let i = 0; i < maxScrolls; i++) {
        const currentItems = await page.locator('[data-testid="listing-card"]').count();

        // Scroll to bottom
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

        // Wait for new items to load
        await page.waitForTimeout(1000);

        const newItemCount = await page.locator('[data-testid="listing-card"]').count();

        // Should load more items
        expect(newItemCount).toBeGreaterThan(currentItems);

        itemCount = newItemCount;
      }

      // Should have loaded significant number of items
      expect(itemCount).toBeGreaterThan(50);
    });
  });

  test.describe('Stress Testing', () => {
    test('rapid form submissions', async ({ page }) => {
      await page.goto('/contact');

      // Submit multiple forms rapidly
      for (let i = 0; i < 5; i++) {
        await page.fill('input[name="name"]', `Test User ${i}`);
        await page.fill('input[name="email"]', `test${i}@example.com`);
        await page.fill('textarea[name="message"]', `Test message ${i}`);

        const submitPromise = page.click('button[type="submit"]');

        // Don't wait for response, submit rapidly
        if (i < 4) {
          await page.waitForTimeout(100); // Brief pause between submissions
        } else {
          await submitPromise; // Wait for last submission
        }
      }

      // Should handle rapid submissions gracefully
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test('browser tab stress test', async ({ context }) => {
      const tabs = [];
      const tabCount = 5;

      // Open multiple tabs with different pages
      for (let i = 0; i < tabCount; i++) {
        const page = await context.newPage();
        tabs.push(page);

        await page.goto(`/listings?page=${i + 1}`);
        await page.waitForLoadState('networkidle');
      }

      // All tabs should be responsive
      for (const tab of tabs) {
        await expect(tab.locator('header')).toBeVisible();
      }

      // Close tabs
      for (const tab of tabs) {
        await tab.close();
      }
    });
  });
});
