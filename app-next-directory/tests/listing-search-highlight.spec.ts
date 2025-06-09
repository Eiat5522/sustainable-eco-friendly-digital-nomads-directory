import { test, expect } from './helpers/test-setup';

test.describe('Listing Search Highlighting', () => {
  test.beforeEach(async ({ mockListingPage }) => {
    // Navigate to the test search page
    await mockListingPage.page.goto('/test/search');
  });

  test('highlights listing title when search term matches', async ({ mockListingPage }) => {
    const { page, performSearch } = mockListingPage;
    await performSearch('eco');
    
    const listingCard = page.locator('[data-testid="listing-card"]').first();
    const highlightedTitle = listingCard.locator('[data-testid="listing-title"] mark');
    
    await expect(highlightedTitle).toBeVisible();
    await expect(highlightedTitle).toHaveClass('bg-yellow-100');
  });
  test('highlights listing description when search term matches', async ({ mockListingPage }) => {
    const { page, performSearch } = mockListingPage;
    await performSearch('sustainable');
    
    const listingCard = page.locator('[data-testid="listing-card"]').first();
    const highlightedDescription = listingCard.locator('[data-testid="listing-description"] mark');
    
    await expect(highlightedDescription).toBeVisible();
    await expect(highlightedDescription).toHaveClass('bg-yellow-100');
  });
  test('highlights eco tags when search term matches', async ({ mockListingPage }) => {
    const { page, performSearch } = mockListingPage;
    await performSearch('solar');
    
    const listingCard = page.locator('[data-testid="listing-card"]').first();
    const highlightedTag = listingCard.locator('[data-testid="eco-tag"] mark').first();
    
    await expect(highlightedTag).toBeVisible();
    await expect(highlightedTag).toHaveClass('bg-yellow-100');
  });
  test('highlights digital nomad features when search term matches', async ({ mockListingPage }) => {
    const { page, performSearch } = mockListingPage;
    await performSearch('wifi');
    
    const listingCard = page.locator('[data-testid="listing-card"]').first();
    const highlightedFeature = listingCard.locator('[data-testid="nomad-feature"] mark').first();
    
    await expect(highlightedFeature).toBeVisible();
    await expect(highlightedFeature).toHaveClass('bg-yellow-100');
  });  test('handles multiple word searches', async ({ mockListingPage }) => {
    const { page, performSearch } = mockListingPage;
    await performSearch('eco friendly');
    
    const listingCard = page.locator('[data-testid="listing-card"]').first();
    const highlightedElements = listingCard.locator('mark.bg-yellow-100');
    
    // Should find at least two highlighted terms
    await expect(highlightedElements).toHaveCount(2);
  });
  test('handles case-insensitive searches', async ({ mockListingPage }) => {
    const { page, performSearch } = mockListingPage;
    await performSearch('ECO');
    
    const listingCard = page.locator('[data-testid="listing-card"]').first();
    const highlightedElements = listingCard.locator('mark.bg-yellow-100');
    
    await expect(highlightedElements).toHaveCount(1);
  });
});
