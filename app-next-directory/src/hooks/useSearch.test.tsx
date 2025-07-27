import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { useSearch } from './useSearch';
import userEvent from '@testing-library/user-event';

// Mock fetch directly using Jest standard approach to bypass global mocks
const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.useFakeTimers(); // Use fake timers for debounce to work with fetch

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockImplementation(async (input, init) => {
    let text = '';
    let body: any = {};

    if (init && typeof init.body === 'string') {
      text = init.body;
    } else if (init && typeof Buffer !== 'undefined' && Buffer.isBuffer(init.body)) {
      text = init.body.toString('utf-8');
    }

    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = {};
      }
    }

    const query = body.query as string | undefined;
    // FORTEST: Debug log for query received by fetch mock
    // eslint-disable-next-line no-console
    console.log('FORTEST: fetch mock received query:', JSON.stringify(query), 'Full body:', JSON.stringify(body), 'Raw body text:', JSON.stringify(text));

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
    } else if (query?.trim() === 'apple'){  // Match trimmed inside logic, store complex query
      // eslint-disable-next-line no-console
      console.log('FORTEST: Matching apple query! Returning Apple result');
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
    return Promise.resolve({
      ok: true,
      json: async () => responseObj,
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/json' })
    } as Response);
  });
});

afterEach(() => {
  mockFetch.mockReset();
  jest.clearAllTimers();
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

    userEvent.click(screen.getByText('Set Query to an'));
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
      // FORTEST: Debug log for actual results
      // eslint-disable-next-line no-console
      console.log('FORTEST: Actual results:', screen.getByTestId('results').textContent);
      expect(screen.getByTestId('results').textContent).toContain('Apple');
    });
  });
});
