import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';

const HeaderMock = jest.fn(() => <div data-testid="header" />);
const FooterMock = jest.fn(() => <div data-testid="footer" />);
const SearchFiltersFormMock = jest.fn(({ initialParams }: { initialParams: Record<string, unknown> }) => (
  <div data-testid="filters-form">{JSON.stringify(initialParams)}</div>
));

jest.mock('@/components/layout/Header', () => ({
  __esModule: true,
  Header: HeaderMock,
}));

jest.mock('@/components/layout/Footer', () => ({
  __esModule: true,
  Footer: FooterMock,
}));

jest.mock('@/components/search/SearchFiltersForm', () => ({
  __esModule: true,
  SearchFiltersForm: SearchFiltersFormMock,
}));

describe('SearchPage (unit)', () => {
  beforeEach(() => {
    HeaderMock.mockClear();
    FooterMock.mockClear();
    SearchFiltersFormMock.mockClear();
  });

  it('exports force-dynamic dynamic rendering mode', async () => {
    const pageModule = await import('./page');
    expect(pageModule.dynamic).toBe('force-dynamic');
  });

  it('resolves provided search params promise and passes them to the form', async () => {
    const { default: SearchPage } = await import('./page');

    const paramsPromise = Promise.resolve({ q: 'eco', limit: '10' });
    const element = await SearchPage({ searchParams: paramsPromise });
    render(element);

    expect(HeaderMock).toHaveBeenCalled();
    expect(FooterMock).toHaveBeenCalled();
    expect(SearchFiltersFormMock).toHaveBeenCalledWith(
      expect.objectContaining({ initialParams: { q: 'eco', limit: '10' } }),
      undefined,
    );
    expect(screen.getByTestId('filters-form')).toHaveTextContent('"q":"eco"');
  });

  it('uses an empty object when search params are undefined', async () => {
    const { default: SearchPage } = await import('./page');

    const element = await SearchPage({});
    render(element);

    expect(SearchFiltersFormMock).toHaveBeenCalledWith(
      expect.objectContaining({ initialParams: {} }),
      undefined,
    );
    expect(screen.getByTestId('filters-form')).toHaveTextContent('{}');
  });
});
