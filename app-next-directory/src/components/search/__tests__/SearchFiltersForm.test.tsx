/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { SearchFiltersForm } from '../SearchFiltersForm';

jest.mock('@/components/ui/filter-multi-select', () => ({
  FilterMultiSelect: jest.fn(({ selected, onChange, label }) => (
    <div>
      <label>{label}</label>
      <input
        data-testid={`filter-${label.toLowerCase().replace(/\s/g, '-')}`}
        value={selected.join(',')}
        onChange={e => onChange(e.target.value.split(','))}
      />
    </div>
  )),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch

describe('SearchFiltersForm', () => {
  let pushMock: jest.Mock;
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    pushMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    fetchMock = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the form with initial values', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ cities: [{ name: 'Testville' }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    render(<SearchFiltersForm initialParams={{ q: 'test' }} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search by name, city, or amenities')).toHaveValue('test');
    });
  });

  it('fetches and displays filter options', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/api/cities')) {
        return Promise.resolve(
          new Response(JSON.stringify({ cities: [{ name: 'Testville' }] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }
      if (url.includes('/api/categories')) {
        return Promise.resolve(
          new Response(JSON.stringify({ categories: ['Coworking'] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }
      if (url.includes('/api/amenities')) {
        return Promise.resolve(
          new Response(JSON.stringify({ amenities: [{ name: 'WiFi' }] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }
      return Promise.reject(new Error('not found'));
    });

    render(<SearchFiltersForm initialParams={{}} />);

    await waitFor(() => {
      expect(screen.getByText('Select cities')).toBeInTheDocument();
      expect(screen.getByText('Select workspace types')).toBeInTheDocument();
      expect(screen.getByText('Select amenities')).toBeInTheDocument();
    });
  });

  it('submits the form and navigates to the results page', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    render(<SearchFiltersForm initialParams={{}} />);

    const searchInput = screen.getByPlaceholderText('Search by name, city, or amenities');

await waitFor(() => {
  expect(screen.getByTestId('filter-select-cities')).toBeInTheDocument();
  expect(screen.getByTestId('filter-select-workspace-types')).toBeInTheDocument();
  expect(screen.getByTestId('filter-select-amenities')).toBeInTheDocument();
});

    fireEvent.change(searchInput, {
      target: { value: 'new search' },
    });

    await waitFor(() => {
      expect(searchInput).toHaveValue('new search');
    });

    fireEvent.submit(screen.getByTestId('search-form'));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledTimes(1);
      const calledUrl = new URL(pushMock.mock.calls[0][0], 'http://localhost');
      expect(calledUrl.pathname).toBe('/search/results');
      expect(calledUrl.searchParams.get('q')).toBe('new search');
      expect(calledUrl.searchParams.get('page')).toBe('1');
      expect(calledUrl.searchParams.get('facets')).toBe('1');
      expect(calledUrl.searchParams.get('limit')).toBe('12');
    });
  });

  it('submits the form with filters and navigates to the results page', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    render(<SearchFiltersForm initialParams={{}} />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    const citiesInput = screen.getByTestId('filter-select-cities');
    const categoriesInput = screen.getByTestId('filter-select-workspace-types');
    const amenitiesInput = screen.getByTestId('filter-select-amenities');

    fireEvent.change(citiesInput, {
      target: { value: 'Testville' },
    });
    fireEvent.change(categoriesInput, {
      target: { value: 'Coworking' },
    });
    fireEvent.change(amenitiesInput, {
      target: { value: 'WiFi' },
    });

    await waitFor(() => {
      expect(citiesInput).toHaveValue('Testville');
      expect(categoriesInput).toHaveValue('Coworking');
      expect(amenitiesInput).toHaveValue('WiFi');
    });

    fireEvent.submit(screen.getByTestId('search-form'));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledTimes(1);
      const calledUrl = new URL(pushMock.mock.calls[0][0], 'http://localhost');
      expect(calledUrl.pathname).toBe('/search/results');
      expect(calledUrl.searchParams.get('destination')).toBe('Testville');
      expect(calledUrl.searchParams.get('category')).toBe('Coworking');
      expect(calledUrl.searchParams.get('amenities')).toBe('WiFi');
      expect(calledUrl.searchParams.get('page')).toBe('1');
      expect(calledUrl.searchParams.get('facets')).toBe('1');
      expect(calledUrl.searchParams.get('limit')).toBe('12');
    });
  });
});
