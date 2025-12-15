import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { structuredLogger } from '@/lib/logger';

const URL = 'http://localhost:3000/listings/banyan-tree-phuket';

test('leaflet map debug', async ({ page }) => {
  const consoleMessages: Array<{ type: string; text: string; location: unknown }> = [];
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text(), location: msg.location() });
  });

  const requests: Array<Record<string, unknown>> = [];
  page.on('request', req => {
    requests.push({
      url: req.url(),
      method: req.method(),
      resourceType: req.resourceType(),
      stage: 'request',
    });
  });
  page.on('requestfinished', async req => {
    try {
      const res = req.response();
      const status =
        res && typeof (res as unknown as { status: () => Promise<number> }).status === 'function'
          ? await (res as unknown as { status: () => Promise<number> }).status()
          : res
            ? (res as unknown as { status: number }).status
            : null;
      requests.push({
        url: req.url(),
        status,
        resourceType: req.resourceType(),
        stage: 'finished',
      });
    } catch (e) {
      requests.push({
        url: req.url(),
        resourceType: req.resourceType(),
        error: String(e),
        stage: 'finished',
      });
    }
  });
  page.on('requestfailed', req => {
    requests.push({
      url: req.url(),
      failure: req.failure()?.errorText,
      resourceType: req.resourceType(),
      stage: 'failed',
    });
  });

  // Increase viewport so map has space
  await page.setViewportSize({ width: 1400, height: 1000 });

  // Navigate
  await page.goto(URL, { waitUntil: 'networkidle' });

  // Wait a bit for any tiles to load
  await page.waitForTimeout(2500);

  // Capture DOM info about Leaflet
  const mapInfo = await page.evaluate(() => {
    const el =
      document.querySelector('.leaflet-container') || document.querySelector('#map') || null;
    const leafletDiv = el as HTMLElement | null;
    if (!leafletDiv) return { found: false };

    const rect = leafletDiv.getBoundingClientRect();
    const style = window.getComputedStyle(leafletDiv);

    const imgs = Array.from(leafletDiv.querySelectorAll('img')).map(img => ({
      src: (img as HTMLImageElement).src,
      naturalWidth: (img as HTMLImageElement).naturalWidth,
      naturalHeight: (img as HTMLImageElement).naturalHeight,
      complete: (img as HTMLImageElement).complete,
      clientWidth: img.clientWidth,
      clientHeight: img.clientHeight,
    }));

    // Look for leaflet panes
    const panes = Array.from(document.querySelectorAll('.leaflet-pane')).map(p => ({
      className: p.className,
      style: window.getComputedStyle(p).cssText,
    }));

    // Check if Leaflet JS exists

    const L = (window as unknown as { L?: { version?: string } }).L;
    const leafletVersion = L?.version || null;

    return {
      found: true,
      rect: { width: rect.width, height: rect.height, top: rect.top, left: rect.left },
      style: {
        display: style.display,
        visibility: style.visibility,
        background: style.background,
        zIndex: style.zIndex,
      },
      imgs,
      panes: panes.slice(0, 20),
      leafletVersion,
    };
  });

  // Save screenshot of full page and map element
  const outDir = path.join(process.cwd(), 'playwright-debug-output');
  try {
    fs.mkdirSync(outDir);
  } catch (e) {
    /* ok */
  }
  const fullShot = path.join(outDir, 'leaflet-fullpage.png');
  await page.screenshot({ path: fullShot, fullPage: true });

  // Try to screenshot only the map element if present
  try {
    const mapEl = await page.$('.leaflet-container, #map');
    if (mapEl) {
      await mapEl.screenshot({ path: path.join(outDir, 'leaflet-map.png') });
    }
  } catch (e) {
    // ignore
  }

  // Dump collected info to a JSON file
  const dump = {
    url: URL,
    mapInfo,
    consoleMessages,
    requestsLast: requests.slice(-200),
  };
  fs.writeFileSync(path.join(outDir, 'leaflet-debug.json'), JSON.stringify(dump, null, 2));

  // Print summary to test output
  structuredLogger.debug('MAP INFO:', { mapInfo });
  structuredLogger.debug('CONSOLE MESSAGES:', { consoleMessages });
  structuredLogger.debug('REQUESTS (last):', { requests: requests.slice(-50) });

  // Basic expectations to surface failures in test output
  expect(mapInfo.found).toBeTruthy();
  expect(mapInfo.rect.width).toBeGreaterThan(0);
  expect(mapInfo.rect.height).toBeGreaterThan(0);
});
