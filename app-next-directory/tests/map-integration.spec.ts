import { expect } from '@playwright/test';
import { test } from './utils/test-fixtures';
import {
  waitForMapLoad,
  getMapBounds,
  panMap,
  getVisibleMarkers,
  clickMarkerByIndex,
  getPopupContent
} from './utils/map-test-utils';
import { applyFilters, clearFilters } from './utils/filter-test-utils';
import { expectLoading, expectEmptyState } from './utils/test-assertions';
import { setupMockApi, setupViewport } from './utils/test-setup';

test.describe('Map Integration', () => {
  test.beforeEach(async ({ page, mockListings }) => {
    // Setup mock API response
    await setupMockApi(page, mockListings);
    
    // Navigate to listings page
    await page.goto('/listings');
    
    // Wait for map to load
    await waitForMapLoad(page);
  });

  test('should display map with markers', async ({ page }) => {
    // Check if map container is rendered
    await expect(page.locator('#map')).toBeVisible();
    
    // Check if markers are added to the map
    await expect(page.locator('.leaflet-marker-icon')).toBeVisible();
  });

  test('should show marker clusters when zoomed out', async ({ page }) => {
    // Wait for clustering to initialize
    await page.waitForSelector('.custom-marker-cluster');
    
    // Check if cluster icons are visible
    const clusters = await page.locator('.cluster-icon').count();
    expect(clusters).toBeGreaterThan(0);
  });

  test('should filter listings based on map bounds', async ({ page }) => {
    // Get initial marker count
    const initialCount = await page.locator('.marker-icon').count();

    // Pan map to Bangkok coordinates
    await panMap(page, 13.7563, 100.5018);

    // Wait for listings to update and check bounds
    await page.waitForTimeout(500);
    const bounds = await getMapBounds(page);
    expect(bounds).toBeTruthy();

    // Verify marker count has changed
    const newCount = await page.locator('.marker-icon').count();
    expect(newCount).not.toBe(initialCount);
  });

  test('should show popup with listing details on marker click', async ({ page }) => {
    // Click first marker
    await clickMarkerByIndex(page, 0);

    // Get and verify popup content
    const content = await getPopupContent(page);
    expect(content.title).toBeTruthy();
    expect(content.address).toBeTruthy();
    expect(content.tags.length).toBeGreaterThan(0);
  });

  test('should filter markers by category', async ({ page }) => {
    // Get initial marker count
    const initialCount = await page.locator('.marker-icon').count();

    // Apply coworking filter
    await applyFilters(page, { categories: ['coworking'] });

    // Get filtered markers
    const markers = await getVisibleMarkers(page);
    expect(markers.length).toBeLessThan(initialCount);
    markers.forEach(marker => {
      expect(marker.text).toBe('🏢'); // Coworking icon
    });
  });

  test('should filter markers by eco tags', async ({ page }) => {
    // Get initial count
    const initialCount = await page.locator('.marker-icon').count();

    // Apply zero-waste filter
    await applyFilters(page, { ecoTags: ['zero-waste'] });

    // Verify filtered markers
    const markers = await page.locator('.marker-icon').all();
    expect(markers.length).toBeLessThan(initialCount);

    // Check first marker's popup for tag
    await clickMarkerByIndex(page, 0);
    const content = await getPopupContent(page);
    expect(content.tags).toContain('zero-waste');
  });

  test('should handle multiple filters', async ({ page }) => {
    // Apply both category and eco tag filters
    await applyFilters(page, {
      categories: ['coworking'],
      ecoTags: ['zero-waste']
    });

    // Get filtered markers
    const markers = await getVisibleMarkers(page);
    
    // Verify all visible markers are coworking spaces
    markers.forEach(marker => {
      expect(marker.text).toBe('🏢');
    });

    // Verify first marker has zero-waste tag
    await clickMarkerByIndex(page, 0);
    const content = await getPopupContent(page);
    expect(content.tags).toContain('zero-waste');
  });

  test('should clear filters', async ({ page }) => {
    // Apply filters first
    await applyFilters(page, {
      categories: ['coworking'],
      ecoTags: ['zero-waste']
    });

    const filteredCount = await page.locator('.marker-icon').count();

    // Clear filters
    await clearFilters(page);

    // Verify original marker count is restored
    const resetCount = await page.locator('.marker-icon').count();
    expect(resetCount).toBeGreaterThan(filteredCount);
  });
  test('should handle mobile responsive design', async ({ page }) => {
    // Set viewport to mobile size
    await setupViewport(page, 'mobile');

    // Check if map container adjusts
    const mapContainer = await page.locator('#map');
    const boundingBox = await mapContainer.boundingBox();
    expect(boundingBox?.width).toBeLessThanOrEqual(375);

    // Verify marker and cluster sizes are appropriate for mobile
    const markerSize = await page.evaluate(() => {
      const marker = document.querySelector('.marker-icon');
      if (!marker) return null;
      const style = window.getComputedStyle(marker);
      return {
        fontSize: style.fontSize,
        lineHeight: style.lineHeight
      };
    });

    expect(markerSize?.fontSize).toBe('14px');
    expect(markerSize?.lineHeight).toBe('24px');
  });

  test('should show empty state when no listings match filters', async ({ page }) => {
    // Apply non-matching filters
    await applyFilters(page, {
      categories: ['coworking'],
      ecoTags: ['eco-construction', 'water-conservation']
    });

    // Verify no markers are visible
    const markers = await page.locator('.marker-icon').all();
    expect(markers.length).toBe(0);

    // Check empty state message
    await expectEmptyState(page);
  });

  test('should show loading state while fetching', async ({ page }) => {
    // Apply filters to trigger loading state
    await applyFilters(page, { categories: ['coworking'] });
    
    // Verify loading state appears
    await expectLoading(page, true);
    
    // Wait for loading to complete
    await expectLoading(page, false);
  });
});
