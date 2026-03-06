/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';
import type React from 'react';
import type { ListingSummaryDTO } from '@/types/dto';

jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

jest.mock('@/components/layout/PageLayoutServer', () => ({
  PageLayoutServer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/listings/ListingGrid', () => ({
  ListingGrid: ({ listings }: { listings: Array<{ id: string; name: string }> }) => (
    <div>ListingGrid: {listings.length}</div>
  ),
}));

jest.mock('@/lib/data-access/categories.dal', () => ({
  getAllCategorySlugs: jest.fn(),
  getCategoryBySlug: jest.fn(),
  getCategoryListings: jest.fn(),
}));

import {
  getAllCategorySlugs,
  getCategoryBySlug,
  getCategoryListings,
} from '@/lib/data-access/categories.dal';

const mockGetAllCategorySlugs = getAllCategorySlugs as jest.MockedFunction<
  typeof getAllCategorySlugs
>;
const mockGetCategoryBySlug = getCategoryBySlug as jest.MockedFunction<typeof getCategoryBySlug>;
const mockGetCategoryListings = getCategoryListings as jest.MockedFunction<
  typeof getCategoryListings
>;
const mockNotFound = notFound as jest.MockedFunction<typeof notFound>;

describe('CategoryDetailPage', () => {
  beforeEach(() => {
    mockGetAllCategorySlugs.mockReset();
    mockGetCategoryBySlug.mockReset();
    mockGetCategoryListings.mockReset();
    mockNotFound.mockReset();
    mockNotFound.mockImplementation(() => {
      throw new Error('notFound');
    });
  });

  it('generateStaticParams returns category slugs', async () => {
    mockGetAllCategorySlugs.mockResolvedValueOnce(['coworking', 'cafe']);

    const { generateStaticParams } = await import('../page');
    const result = await generateStaticParams();

    expect(result).toEqual([{ slug: 'coworking' }, { slug: 'cafe' }]);
  });

  it('renders category content and listings', async () => {
    mockGetCategoryBySlug.mockResolvedValueOnce({
      id: 'category.coworking',
      name: 'Coworking Space',
      slug: 'coworking',
      title: 'Coworking Space',
      description: 'Sustainable coworking spaces.',
      listingCount: 2,
      seo: {},
    });
    const listings: ListingSummaryDTO[] = [
      { id: 'l1', name: 'Alpha', slug: 'alpha', type: 'coworking', city: null },
      { id: 'l2', name: 'Beta', slug: 'beta', type: 'coworking', city: null },
    ];
    mockGetCategoryListings.mockResolvedValueOnce(listings);

    const Page = (await import('../page')).default;
    const ui = await Page({ params: Promise.resolve({ slug: 'coworking' }) });
    render(ui);

    expect(screen.getByText('Coworking Space')).toBeInTheDocument();
    expect(screen.getByText('2 published listings')).toBeInTheDocument();
    expect(screen.getByText('ListingGrid: 2')).toBeInTheDocument();
  });

  it('calls notFound when category does not exist', async () => {
    mockGetCategoryBySlug.mockResolvedValueOnce(null);

    const Page = (await import('../page')).default;
    await expect(Page({ params: Promise.resolve({ slug: 'missing' }) })).rejects.toThrow(
      'notFound'
    );

    expect(mockNotFound).toHaveBeenCalled();
  });
});
