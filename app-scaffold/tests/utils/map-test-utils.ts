import { type Page } from '@playwright/test';
import { type Listing } from '@/types/listings';

export async function waitForMapLoad(page: Page) {
  await page.waitForSelector('#map');
  await page.waitForSelector('.leaflet-marker-icon', { state: 'visible' });
}

export async function getMapBounds(page: Page) {
  return await page.evaluate(() => {
    // @ts-expect-error - Leaflet map instance
    const map = window.L?.map;
    if (!map) return null;
    const bounds = map.getBounds();
    return {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    };
  });
}

export async function panMap(page: Page, lat: number, lng: number) {
  await page.evaluate(({ lat, lng }) => {
    // @ts-expect-error - Leaflet map instance
    const map = window.L?.map;
    if (map) {
      map.panTo([lat, lng]);
    }
  }, { lat, lng });
}

export async function getVisibleMarkers(page: Page) {
  return await page.evaluate(() => {
    const markers = document.querySelectorAll('.marker-icon');
    return Array.from(markers).map(marker => ({
      text: marker.textContent,
      isVisible: marker.getBoundingClientRect().top > 0
    }));
  });
}

export async function clickMarkerByIndex(page: Page, index: number) {
  const markers = await page.locator('.marker-icon').all();
  if (markers.length > index) {
    await markers[index].click();
  }
}

export async function getPopupContent(page: Page) {
  const popup = page.locator('.marker-popup');
  await popup.waitFor({ state: 'visible' });
  return {
    title: await popup.locator('h3').textContent(),
    address: await popup.locator('.text-gray-600').textContent(),
    tags: await popup.locator('.bg-green-100').allTextContents()
  };
}
