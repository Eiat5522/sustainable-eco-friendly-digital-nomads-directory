/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type React from 'react';

jest.mock('@/components/layout/PageLayoutServer', () => ({
  PageLayoutServer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/lib/data-access/categories.dal', () => ({
  getCategories: jest.fn(),
}));

import { getCategories } from '@/lib/data-access/categories.dal';

const mockGetCategories = getCategories as jest.MockedFunction<typeof getCategories>;

describe('CategoriesPage', () => {
  beforeEach(() => {
    mockGetCategories.mockReset();
  });

  it('renders empty state when no categories exist', async () => {
    mockGetCategories.mockResolvedValueOnce([]);

    const Page = (await import('../page')).default;
    const ui = await Page();
    render(ui);

    expect(screen.getByText('No categories available right now.')).toBeInTheDocument();
  });

  it('renders category cards linking to detail pages', async () => {
    mockGetCategories.mockResolvedValueOnce([
      {
        id: 'category.coworking',
        name: 'Coworking Space',
        slug: 'coworking',
        title: 'Coworking Space',
        description: 'Sustainable coworking spaces.',
        listingCount: 5,
        heroImageUrl: undefined,
      },
    ]);

    const Page = (await import('../page')).default;
    const ui = await Page();
    render(ui);

    expect(screen.getByRole('link', { name: /coworking space/i })).toHaveAttribute(
      'href',
      '/categories/coworking'
    );
    expect(screen.getByText('5 listings')).toBeInTheDocument();
  });
});
