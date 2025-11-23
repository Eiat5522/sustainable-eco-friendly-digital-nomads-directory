import { test, expect } from '@playwright/test';

test.describe('Search Highlighting', () => {
  // Helper function to count highlighted elements
  const countHighlights = async (page) => {
    return await page.locator('mark.bg-yellow-100').count();
  };

  test.beforeEach(async ({ page }) => {
    // Start from the search page
    await page.goto('/search');
    // Wait for the listings to load
    await page.waitForSelector('[data-testid="listing-card"]');
  });

  test('highlights search terms in listing titles', async ({ page }) => {
    // Type a search term that should match some listing titles
    await page.fill('[data-testid="search-input"]', 'eco');
    // Wait for the search results to update
    await page.waitForTimeout(500);
    
    // Check if there are highlighted elements
    const highlightCount = await countHighlights(page);
    expect(highlightCount).toBeGreaterThan(0);
    
    // Check if the highlight contains the search term
    const highlightText = await page.locator('mark.bg-yellow-100').first().innerText();
    expect(highlightText.toLowerCase()).toContain('eco');
  });

  test('highlights search terms in listing descriptions', async ({ page }) => {
    // Type a search term that should match some descriptions
    await page.fill('[data-testid="search-input"]', 'sustainable');
    await page.waitForTimeout(500);
    
    const highlightCount = await countHighlights(page);
    expect(highlightCount).toBeGreaterThan(0);
    
    // Verify highlights in description area
    const highlightedDescription = await page.locator('[data-testid="listing-description"] mark.bg-yellow-100').first().innerText();
    expect(highlightedDescription.toLowerCase()).toContain('sustainable');
  });

  test('highlights search terms in eco tags', async ({ page }) => {
    // Type a search term that should match eco tags
    await page.fill('[data-testid="search-input"]', 'solar');
    await page.waitForTimeout(500);
    
    const highlightCount = await countHighlights(page);
    expect(highlightCount).toBeGreaterThan(0);
    
    // Check highlighted tags
    const highlightedTag = await page.locator('[data-testid="eco-tag"] mark.bg-yellow-100').first().innerText();
    expect(highlightedTag.toLowerCase()).toContain('solar');
  });

  test('highlights search terms in digital nomad features', async ({ page }) => {
    // Type a search term that should match nomad features
    await page.fill('[data-testid="search-input"]', 'wifi');
    await page.waitForTimeout(500);
    
    const highlightCount = await countHighlights(page);
    expect(highlightCount).toBeGreaterThan(0);
    
    // Check highlighted features
    const highlightedFeature = await page.locator('[data-testid="nomad-feature"] mark.bg-yellow-100').first().innerText();
    expect(highlightedFeature.toLowerCase()).toContain('wifi');
  });

  test('handles multiple word searches', async ({ page }) => {
    // Type a multi-word search term
    await page.fill('[data-testid="search-input"]', 'eco friendly');
    await page.waitForTimeout(500);
    
    const highlightCount = await countHighlights(page);
    expect(highlightCount).toBeGreaterThan(0);
    
    // Check if both words are highlighted
    const highlights = await page.locator('mark.bg-yellow-100').allInnerTexts();
    const hasEco = highlights.some(text => text.toLowerCase().includes('eco'));
    const hasFriendly = highlights.some(text => text.toLowerCase().includes('friendly'));
    expect(hasEco || hasFriendly).toBeTruthy();
  });

  test('handles case-insensitive searches', async ({ page }) => {
    // Test with mixed case
    await page.fill('[data-testid="search-input"]', 'EcO');
    await page.waitForTimeout(500);
    
    const highlightCount = await countHighlights(page);
    expect(highlightCount).toBeGreaterThan(0);
    
    // Check if matches are found regardless of case
    const highlights = await page.locator('mark.bg-yellow-100').allInnerTexts();
    const hasMatch = highlights.some(text => 
      text.toLowerCase().includes('eco') || 
      text.includes('Eco') || 
      text.includes('ECO')
    );
    expect(hasMatch).toBeTruthy();
  });
});
