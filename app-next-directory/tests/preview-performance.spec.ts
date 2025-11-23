import { test, expect, Page } from '@playwright/test';

interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  firstContentfulPaint: number;
  domContentLoaded: number;
  largestContentfulPaint: number;
}

async function getPerformanceMetrics(page: Page): Promise<PerformanceMetrics> {
  const performanceEntries = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    const lcp = performance.getEntriesByName('largest-contentful-paint')[0];

    return {
      pageLoadTime: navigation.loadEventEnd - navigation.startTime,
      apiResponseTime: navigation.responseEnd - navigation.requestStart,
      firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
      largestContentfulPaint: lcp ? lcp.startTime : 0,
    };
  });

  return performanceEntries;
}

async function measureEndpoint(page: Page, url: string): Promise<number> {
  const startTime = Date.now();
  const response = await page.request.get(url);
  const endTime = Date.now();
  expect(response.ok()).toBeTruthy();
  return endTime - startTime;
}

// Store metrics at file scope for report generation
let testMetrics: {
  normal?: PerformanceMetrics;
  preview?: PerformanceMetrics;
} = {};

test.describe('Preview Mode Performance Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Clear browser cache and memory cache
    await page.route('**/*', route => {
      route.continue({
        headers: {
          ...route.request().headers(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    });
  });

  test('measure normal vs preview mode performance', async ({ page }) => {
    // Test normal mode
    await page.goto('/listings/test-draft-listing');
    const normalMetrics = await getPerformanceMetrics(page);

    // Enable preview mode and test
    await page.goto('/api/preview?redirect=/listings/test-draft-listing');
    await page.waitForLoadState('networkidle');
    const previewMetrics = await getPerformanceMetrics(page);

    // Store and log results
    testMetrics.normal = normalMetrics;
    testMetrics.preview = previewMetrics;
    console.log('Normal Mode Metrics:', normalMetrics);
    console.log('Preview Mode Metrics:', previewMetrics);

    // Performance assertions
    expect(previewMetrics.pageLoadTime).toBeLessThan(normalMetrics.pageLoadTime * 1.5);
    expect(previewMetrics.firstContentfulPaint).toBeLessThan(normalMetrics.firstContentfulPaint * 1.5);
  });

  test('measure preview API endpoint performance', async ({ page }) => {
    const endpoints = [
      '/api/preview?redirect=/',
      '/api/exit-preview',
    ];

    for (const endpoint of endpoints) {
      const responseTime = await measureEndpoint(page, endpoint);
      console.log(`${endpoint} Response Time:`, responseTime);
      expect(responseTime).toBeLessThan(1000); // Max 1s response time
    }
  });

  test('memory usage in preview mode', async ({ page }) => {
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize || 0);

    // Enable preview mode
    await page.goto('/api/preview?redirect=/');
    await page.waitForLoadState('networkidle');

    // Navigate through several pages in preview mode
    const urls = [
      '/listings/test-draft-listing',
      '/city/test-draft-city',
      '/'
    ];

    for (const url of urls) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
    }

    // Get final memory usage
    const finalMemory = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize || 0);

    // Log memory usage
    console.log('Memory Usage:', {
      initial: initialMemory / 1024 / 1024 + 'MB',
      final: finalMemory / 1024 / 1024 + 'MB',
      difference: (finalMemory - initialMemory) / 1024 / 1024 + 'MB'
    });

    // Assert memory increase is reasonable (less than 50MB)
    expect(finalMemory - initialMemory).toBeLessThan(50 * 1024 * 1024);
  });
});

// Create performance report in JSON format
test.afterAll(async ({ }, testInfo) => {
  const report = {
    timestamp: new Date().toISOString(),
    status: testInfo.status,
    duration: testInfo.duration,
    metrics: testMetrics
  };

  const fs = require('fs');
  const path = require('path');
  const reportDir = path.join(process.cwd(), 'test-results', 'performance');

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(reportDir, `preview-performance-${Date.now()}.json`),
    JSON.stringify(report, null, 2)
  );
});
