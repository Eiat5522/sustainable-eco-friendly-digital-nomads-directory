import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock the Sanity client before importing sitemap
const mockFetch = jest.fn();
jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: mockFetch,
  },
}));

import sitemap from '../sitemap';

describe('sitemap', () => {
  const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    if (originalEnv) {
      process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
    } else {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    }
  });

  it('returns static pages only when Sanity fetch fails', async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    mockFetch.mockRejectedValue(new Error('Sanity error'));

    const result = await sitemap();

    expect(result).toHaveLength(4);
    expect(result[0].url).toBe('http://localhost:3001');
    expect(result[1].url).toBe('http://localhost:3001/listings');
    expect(result[2].url).toBe('http://localhost:3001/categories');
    expect(result[3].url).toBe('http://localhost:3001/cities');
  });

  it('uses custom site URL from environment', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
    mockFetch.mockRejectedValue(new Error('Sanity error'));

    const result = await sitemap();

    expect(result[0].url).toBe('https://example.com');
    expect(result[1].url).toBe('https://example.com/listings');
  });

  it('includes static pages with correct priorities', async () => {
    mockFetch.mockRejectedValue(new Error('Sanity error'));

    const result = await sitemap();

    const homePage = result.find(page => page.url.endsWith('/') || page.url === 'http://localhost:3001');
    const listingsPage = result.find(page => page.url.endsWith('/listings'));
    const categoriesPage = result.find(page => page.url.endsWith('/categories'));
    const citiesPage = result.find(page => page.url.endsWith('/cities'));

    expect(homePage?.priority).toBe(1.0);
    expect(listingsPage?.priority).toBe(0.9);
    expect(categoriesPage?.priority).toBe(0.8);
    expect(citiesPage?.priority).toBe(0.8);
  });

  it('includes static pages with correct change frequencies', async () => {
    mockFetch.mockRejectedValue(new Error('Sanity error'));

    const result = await sitemap();

    const homePage = result.find(page => page.url.endsWith('/') || page.url === 'http://localhost:3001');
    const listingsPage = result.find(page => page.url.endsWith('/listings'));
    const categoriesPage = result.find(page => page.url.endsWith('/categories'));

    expect(homePage?.changeFrequency).toBe('daily');
    expect(listingsPage?.changeFrequency).toBe('hourly');
    expect(categoriesPage?.changeFrequency).toBe('weekly');
  });

  it('handles data fetch gracefully', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
    
    mockFetch
      .mockResolvedValueOnce([
        { slug: 'eco-cafe-bali', _updatedAt: '2024-01-10T00:00:00.000Z' },
        { slug: 'green-coworking', _updatedAt: '2024-01-15T00:00:00.000Z' },
      ])
      .mockResolvedValueOnce([{ category: 'Cafe' }])
      .mockResolvedValueOnce([{ name: 'Bali' }]);

    const result = await sitemap();

    // Should include at least static pages
    expect(result.length).toBeGreaterThanOrEqual(4);
    
    // All entries should have proper structure
    result.forEach(entry => {
      expect(entry.url).toMatch(/^https:\/\/example\.com/);
    });
  });

  it('returns sitemap entries with correct structure', async () => {
    const result = await sitemap();

    // Should have at least static pages
    expect(result.length).toBeGreaterThanOrEqual(4);
    
    // Check that each entry has required fields
    result.forEach(entry => {
      expect(entry).toHaveProperty('url');
      expect(entry).toHaveProperty('lastModified');
      expect(entry).toHaveProperty('changeFrequency');
      expect(entry).toHaveProperty('priority');
    });
  });

  it('returns proper URL format for all entries', async () => {
    const result = await sitemap();

    result.forEach(entry => {
      expect(entry.url).toMatch(/^https?:\/\//);
    });
  });
});
