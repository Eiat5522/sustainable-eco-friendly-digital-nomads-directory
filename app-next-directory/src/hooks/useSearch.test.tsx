import React from 'react';
import { render, act, screen } from '@testing-library/react';
import { useSearch } from './useSearch';
import { SearchFilters, SortOption } from '@/types/search';


// Mock fetch globally
beforeEach(() => {
  global.fetch = jest.fn((url: RequestInfo, options?: RequestInit) => {
    const body = options && options.body ? JSON.parse(options.body as string) : {};
    const response = (data: any): Response =>
      ({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        url: typeof url === 'string' ? url : '',
        redirected: false,
        type: 'basic',
        clone: () => response(data),
        body: null,
        bodyUsed: false,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
        text: () => Promise.resolve(JSON.stringify(data)),
        json: () => Promise.resolve(data),
      } as unknown as Response);

    if (body.query === 'an') {
      return Promise.resolve(response({ results: [{ id: 2, name: 'Banana' }], pagination: {}, isLoading: false, error: null }));
    }
    if (body.query === 'xyz') {
      return Promise.resolve(response({ results: [], pagination: {}, isLoading: false, error: null }));
    }
    if (body.query === '  apple  ') {
      return Promise.resolve(response({ results: [{ id: 1, name: 'Apple' }], pagination: {}, isLoading: false, error: null }));
    }
    // Default
    return Promise.resolve(response({ results: [], pagination: {}, isLoading: false, error: null }));
  }) as jest.MockedFunction<typeof fetch>;
});

afterEach(() => {
  jest.resetAllMocks();
});

interface TestComponentProps {
  initialQuery?: string;
}

const TestComponent: React.FC<TestComponentProps> = ({ initialQuery = '' }) => {
  const search = useSearch({ initialQuery, initialFilters: { query: '', ecoTags: [], hasDigitalNomadFeatures: false } });
  return (
    <>
      <span data-testid="query">{search.query}</span>
      <span data-testid="results">{JSON.stringify(search.results)}</span>
      <button onClick={() => search.handleQueryChange('an')}>Set Query to an</button>
      <button onClick={() => search.handleQueryChange('xyz')}>Set Query to xyz</button>
      <button onClick={() => search.handleQueryChange('  apple  ')}>Set Query to spaced apple</button>
    </>
  );
}

describe('useSearch', () => {
  it('should update query and results correctly', async () => {
    render(<TestComponent initialQuery="" />);
    expect(screen.getByTestId('query').textContent).toBe('');
    expect(screen.getByTestId('results').textContent).toBe('[]');
    await act(async () => {
      screen.getByText('Set Query to an').click();
    });
    expect(screen.getByTestId('query').textContent).toBe('an');
    expect(screen.getByTestId('results').textContent).toContain('Banana');
  });

  it('should handle empty initial data', async () => {
    render(<TestComponent initialQuery="" />);
    expect(screen.getByTestId('query').textContent).toBe('');
    expect(screen.getByTestId('results').textContent).toBe('[]');
    await act(async () => {
      screen.getByText('Set Query to test').click?.(); // fallback if button not present
    });
    // Query will not change since no button for 'test', but results remain empty
    expect(screen.getByTestId('results').textContent).toBe('[]');
  });

  it('should handle no matches', async () => {
    render(<TestComponent initialQuery="" />);
    await act(async () => {
      screen.getByText('Set Query to xyz').click();
    });
    expect(screen.getByTestId('query').textContent).toBe('xyz');
    expect(screen.getByTestId('results').textContent).toBe('[]');
  });

  it('should not trim the search term before filtering', async () => {
    render(<TestComponent initialQuery="" />);
    await act(async () => {
      screen.getByText('Set Query to spaced apple').click();
    });
    expect(screen.getByTestId('query').textContent).toBe('  apple  ');
    expect(screen.getByTestId('results').textContent).toContain('Apple');
  });
});
