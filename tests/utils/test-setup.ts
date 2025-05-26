import { type Page } from '@playwright/test';
import { type Listing } from '@/types/listings';

export async function setupMockApi(page: Page, listings: Listing[]) {
  await page.route('/api/legacy-listings', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: listings
      })
    });
  });
}

export async function setupViewport(page: Page, device: 'desktop' | 'tablet' | 'mobile') {
  const viewports = {
    desktop: { width: 1280, height: 800 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 }
  };
  
  await page.setViewportSize(viewports[device]);
}

export async function setupLocalStorage(page: Page, data: Record<string, any>) {
  await page.evaluate((storageData) => {
    for (const [key, value] of Object.entries(storageData)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, data);
}

export async function clearLocalStorage(page: Page) {
  await page.evaluate(() => localStorage.clear());
}

export async function setupNetworkConditions(page: Page, condition: 'fast' | 'slow' | 'offline') {
  const conditions = {
    fast: { offline: false, latency: 0 },
    slow: { offline: false, latency: 200 },
    offline: { offline: true, latency: 0 }
  };
  
  const client = await page.context().newCDPSession(page);
  await client.send('Network.emulateNetworkConditions', conditions[condition]);
}
