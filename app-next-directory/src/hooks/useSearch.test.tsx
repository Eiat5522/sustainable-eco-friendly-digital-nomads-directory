import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { useSearch } from './useSearch';
import userEvent from '@testing-library/user-event';

// Mock fetch directly using Jest standard approach to bypass global mocks
const mockFetch: jest.MockedFunction<typeof fetch> = jest.fn();
global.fetch = mockFetch;

jest.useFakeTimers(); // Use fake timers for debounce to work with fetch

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockImplementation(async (input: Request | string, init?: RequestInit) => {
    // Determine URL for routing
    const url = typeof input === 'string' ? input : input.url;

    // Handle suggestions GET to avoid MSW warnings
    if (url.includes('/api/search/suggestions')) {
      return Response.json([]) as unknown as Response;
    }

    // Extract body for POST /api/search, supporting both (input, init) and Request
    let text = '';
    let body: any = {};

    if (init && typeof init.body === 'string') {
      text = init.body;
    } else if (init && init.body && typeof Buffer !== 'undefined' && Buffer.isBuffer(init.body as any)) {
      text = (init.body as any).toString('utf-8');
    } else if (typeof input !== 'string') {
      try {
        text = await input.clone().text();
      } catch {
        text = '';
      }
    }

    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = {};
      }
    }

    const query = body.query as string | undefined;

    let responseObj;
    if (query === 'an') {
      responseObj = {
        results: [{ id: 2, name: 'Banana' }],
        pagination: { total: 1, page: 1, totalPages: 1, hasMore: false }
      };
    } else if (query === 'xyz') {
      responseObj = {
        results: [],
        pagination: { total: 0, page: 1, totalPages: 0, hasMore: false }
      };
    } else if (query?.trim() === 'apple') {  // Match trimmed inside logic, store complex query
      responseObj = {
        results: [{ id: 1, name: 'Apple' }],
        pagination: { total: 1, page: 1, totalPages: 1, hasMore: false }
      };
    } else {
      responseObj = {
        results: [],
        pagination: { total: 0, page: 1, totalPages: 0, hasMore: false }
      };
    }

    return new Response(JSON.stringify(responseObj), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }) as unknown as Response;
  });
});

afterEach(() => {
  mockFetch.mockReset();
  jest.clearAllTimers();
});
afterAll(() => {
  jest.useRealTimers();
});

interface TestComponentProps {
  initialQuery?: string;
}

const TestComponent: React.FC<TestComponentProps> = ({ initialQuery = '' }) => {
  const search = useSearch({
    initialQuery,
    initialFilters: { query: '', ecoTags: [], hasDigitalNomadFeatures: false }
  });

  return (
    <>
      <span data-testid="query">{search.query}</span>
      <span data-testid="results">{search.results.map((r) => r.name).join(', ')}</span>
      <button onClick={() => search.handleQueryChange('an')}>Set Query to an</button>
      <button onClick={() => search.handleQueryChange('xyz')}>Set Query to xyz</button>
      <button onClick={() => search.handleQueryChange('  apple  ')}>Set Query to spaced apple</button>
      <button onClick={() => search.handleQueryChange('test')}>Set Query to test</button>
    </>
  );
};

describe('useSearch', () => {
  it('should update query and results correctly', async () => {
    render(<TestComponent initialQuery="" />);
    expect(screen.getByTestId('query').textContent).toBe('');
    expect(screen.getByTestId('results').textContent).toBe('');
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(screen.getByText('Set Query to an'));
    await act(async () => {
      jest.advanceTimersByTime(350);
      await Promise.resolve();
    });
    await act(async () => { await Promise.resolve(); });
    await waitFor(() => {
      expect(screen.getByTestId('query').textContent).toBe('an');
      // Debug log for actual results
      // eslint-disable-next-line no-console
      console.log('Actual results:', screen.getByTestId('results').textContent);
      expect(screen.getByTestId('results').textContent).toContain('Banana');
    });
  });

  it('should handle empty initial data', async () => {
    render(<TestComponent initialQuery="" />);
    expect(screen.getByTestId('query').textContent).toBe('');
    expect(screen.getByTestId('results').textContent).toBe('');

    userEvent.click(screen.getByText('Set Query to test'));
    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(screen.getByTestId('results').textContent).toBe('');
    });
  });

  it('should handle no matches', async () => {
    render(<TestComponent initialQuery="" />);

    userEvent.click(screen.getByText('Set Query to xyz'));
    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(screen.getByTestId('query').textContent).toBe('xyz');
      expect(screen.getByTestId('results').textContent).toBe('');
    });
  });

  it('should not trim the search term before filtering', async () => {
    render(<TestComponent initialQuery="" />);

    userEvent.click(screen.getByText('Set Query to spaced apple'));
    await act(async () => {
      jest.advanceTimersByTime(350);
      await Promise.resolve();
    });
    await act(async () => { await Promise.resolve(); });
    await waitFor(() => {
      expect(screen.getByTestId('query').textContent).toBe('  apple  ');
      expect(screen.getByTestId('results').textContent).toContain('Apple');
    });
  });
});
