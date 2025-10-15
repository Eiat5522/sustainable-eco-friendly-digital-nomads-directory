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

  it('includes listing pages when data is available', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
    
    mockFetch
      .mockResolvedValueOnce([
        { slug: 'eco-cafe-bali', _updatedAt: '2024-01-10T00:00:00.000Z' },
        { slug: 'green-coworking', _updatedAt: '2024-01-15T00:00:00.000Z' },
      ])
      .mockResolvedValueOnce([{ category: 'test' }])
      .mockResolvedValueOnce([{ name: 'test' }]);

    const result = await sitemap();
    
    // Debug output
    console.log('All result URLs:', result.map(r => r.url));
    
    const listingPages = result.filter(page => page.url.includes('/listings/'));
    console.log('Listing pages:', listingPages);

    const listingPage1 = result.find(page => page.url === 'https://example.com/listings/eco-cafe-bali');
    const listingPage2 = result.find(page => page.url === 'https://example.com/listings/green-coworking');

    expect(listingPage1).toBeDefined();
    expect(listingPage1?.priority).toBe(0.7);
    expect(listingPage1?.changeFrequency).toBe('weekly');
    expect(listingPage2).toBeDefined();
  });

  it('includes category pages when data is available', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
    
    mockFetch
      .mockResolvedValueOnce([{ slug: 'test', _updatedAt: '2024-01-10T00:00:00.000Z' }])
      .mockResolvedValueOnce([
        { category: 'Cafe' },
        { category: 'Coworking' },
      ])
      .mockResolvedValueOnce([{ name: 'test' }]);

    const result = await sitemap();

    const categoryPage1 = result.find(page => page.url === 'https://example.com/category/cafe');
    const categoryPage2 = result.find(page => page.url === 'https://example.com/category/coworking');

    expect(categoryPage1).toBeDefined();
    expect(categoryPage1?.priority).toBe(0.6);
    expect(categoryPage2).toBeDefined();
  });

  it('includes city pages when data is available', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
    
    mockFetch
      .mockResolvedValueOnce([{ slug: 'test', _updatedAt: '2024-01-10T00:00:00.000Z' }])
      .mockResolvedValueOnce([{ category: 'test' }])
      .mockResolvedValueOnce([
        { name: 'Bali' },
        { name: 'Lisbon' },
      ]);

    const result = await sitemap();

    const cityPage1 = result.find(page => page.url === 'https://example.com/city/bali');
    const cityPage2 = result.find(page => page.url === 'https://example.com/city/lisbon');

    expect(cityPage1).toBeDefined();
    expect(cityPage1?.priority).toBe(0.6);
    expect(cityPage2).toBeDefined();
  });

  it('filters out invalid listings without slugs', async () => {
    mockFetch
      .mockResolvedValueOnce([
        { slug: 'valid-slug', _updatedAt: '2024-01-10T00:00:00.000Z' },
        { slug: null, _updatedAt: '2024-01-10T00:00:00.000Z' },
        { slug: '', _updatedAt: '2024-01-10T00:00:00.000Z' },
      ])
      .mockResolvedValueOnce([{ category: 'test' }])
      .mockResolvedValueOnce([{ name: 'test' }]);

    const result = await sitemap();

    const listingPages = result.filter(page => page.url.includes('/listings/'));
    expect(listingPages).toHaveLength(1);
    expect(listingPages[0].url).toContain('valid-slug');
  });

  it('filters out invalid categories', async () => {
    mockFetch
      .mockResolvedValueOnce([{ slug: 'test', _updatedAt: '2024-01-10T00:00:00.000Z' }])
      .mockResolvedValueOnce([
        { category: 'Valid' },
        { category: null },
        { category: '' },
      ])
      .mockResolvedValueOnce([{ name: 'test' }]);

    const result = await sitemap();

    const categoryPages = result.filter(page => page.url.includes('/category/'));
    expect(categoryPages).toHaveLength(1);
  });

  it('filters out invalid cities', async () => {
    mockFetch
      .mockResolvedValueOnce([{ slug: 'test', _updatedAt: '2024-01-10T00:00:00.000Z' }])
      .mockResolvedValueOnce([{ category: 'test' }])
      .mockResolvedValueOnce([
        { name: 'Valid City' },
        { name: null },
        { name: '' },
      ]);

    const result = await sitemap();

    const cityPages = result.filter(page => page.url.includes('/city/'));
    expect(cityPages).toHaveLength(1);
  });

  it('converts category names to lowercase in URLs', async () => {
    mockFetch
      .mockResolvedValueOnce([{ slug: 'test', _updatedAt: '2024-01-10T00:00:00.000Z' }])
      .mockResolvedValueOnce([{ category: 'COWORKING' }])
      .mockResolvedValueOnce([{ name: 'test' }]);

    const result = await sitemap();

    const categoryPage = result.find(page => page.url.includes('/category/'));
    expect(categoryPage?.url).toContain('/category/coworking');
  });

  it('converts city names to lowercase in URLs', async () => {
    mockFetch
      .mockResolvedValueOnce([{ slug: 'test', _updatedAt: '2024-01-10T00:00:00.000Z' }])
      .mockResolvedValueOnce([{ category: 'test' }])
      .mockResolvedValueOnce([{ name: 'LISBON' }]);

    const result = await sitemap();

    const cityPage = result.find(page => page.url.includes('/city/'));
    expect(cityPage?.url).toContain('/city/lisbon');
  });

  it('sets lastModified date for listings from _updatedAt', async () => {
    const testDate = '2024-01-10T12:30:00.000Z';
    mockFetch
      .mockResolvedValueOnce([
        { slug: 'test-listing', _updatedAt: testDate },
      ])
      .mockResolvedValueOnce([{ category: 'test' }])
      .mockResolvedValueOnce([{ name: 'test' }]);

    const result = await sitemap();

    const listingPage = result.find(page => page.url.includes('test-listing'));
    expect(listingPage?.lastModified).toEqual(new Date(testDate));
  });
});
