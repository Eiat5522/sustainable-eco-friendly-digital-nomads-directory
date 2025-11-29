/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import SearchPage from '../page';

// Mock the SearchFiltersForm component
jest.mock('@/components/search/SearchFiltersForm', () => ({
  SearchFiltersForm: jest.fn(({ initialParams }) => (
    <div data-testid="search-filters-form">{JSON.stringify(initialParams)}</div>
  )),
}));

// Mock Header and Footer
jest.mock('@/components/layout/Header', () => ({
  Header: () => <header data-testid="header" />,
}));
jest.mock('@/components/layout/Footer', () => ({
  Footer: () => <footer data-testid="footer" />,
}));

// Mock SearchPageContent to make it synchronous for testing
jest.mock('../SearchPageContent', () => ({
  __esModule: true,
  default: ({ searchParams }: { searchParams: Record<string, unknown> }) => (
    <div data-testid="search-page-content">{JSON.stringify(searchParams)}</div>
  ),
}));

describe('SearchPage', () => {
  it('renders header, footer and search page content', async () => {
    const searchParams = { q: 'test' };
    const ui = await SearchPage({ searchParams: Promise.resolve(searchParams) });
    render(ui);

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('passes searchParams to SearchPageContent', async () => {
    const searchParams = { q: 'test', city: 'Testville' };
    const ui = await SearchPage({ searchParams: Promise.resolve(searchParams) });
    render(ui);

    const searchPageContent = screen.getByTestId('search-page-content');
    expect(searchPageContent.textContent).toBe(JSON.stringify(searchParams));
  });

  it('handles empty searchParams', async () => {
    const ui = await SearchPage({ searchParams: Promise.resolve({}) });
    render(ui);

    const searchPageContent = screen.getByTestId('search-page-content');
    expect(searchPageContent.textContent).toBe(JSON.stringify({}));
  });
});

