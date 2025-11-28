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

describe('SearchPage', () => {
    const ui = await SearchPage({ searchParams: Promise.resolve(searchParams) });
    await act(async () => {
      render(ui);
    });

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByTestId('search-filters-form')).toBeInTheDocument();
  });

  it('passes searchParams to SearchFiltersForm', async () => {
    const searchParams = { q: 'test', city: 'Testville' };
    const ui = await SearchPage({ searchParams: Promise.resolve(searchParams) });
    await act(async () => {
      render(ui);
    });

    const searchFiltersForm = screen.getByTestId('search-filters-form');
    expect(searchFiltersForm.textContent).toBe(JSON.stringify(searchParams));
  });

  it('handles empty searchParams', async () => {
    const ui = await SearchPage({ searchParams: Promise.resolve({}) });
    await act(async () => {
      render(ui);
    });

    const searchFiltersForm = screen.getByTestId('search-filters-form');
    expect(searchFiltersForm.textContent).toBe(JSON.stringify({}));
  });
});
