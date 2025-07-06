import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { useSearch } from './useSearch';
import fetchMock from 'jest-fetch-mock';
import userEvent from '@testing-library/user-event';

jest.useFakeTimers();
fetchMock.enableMocks();

beforeEach(() => {
  fetchMock.resetMocks();
  fetchMock.mockResponse(async (req) => {
    let text = '';
    let body: any = {};

    // 1) If req.body is already a string
    if (typeof req.body === 'string') {
      text = req.body;
    }
    // 2) If it's a Node Buffer
    else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(req.body)) {
      text = req.body.toString('utf-8');
    }

    // Parse JSON once
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = {};
      }
    }

    const query = body.query as string | undefined;

    // Return mocked payloads
    if (query === 'an') {
      return JSON.stringify({
        results: [{ id: 2, name: 'Banana' }],
        pagination: { total: 1, page: 1, totalPages: 1, hasMore: false },
        isLoading: false,
        error: null
      });
    }

    if (query === 'xyz') {
      return JSON.stringify({
        results: [],
        pagination: { total: 0, page: 1, totalPages: 0, hasMore: false },
        isLoading: false,
        error: null
      });
    }

    if (query === '  apple  ') {
      return JSON.stringify({
        results: [{ id: 1, name: 'Apple' }],
        pagination: { total: 1, page: 1, totalPages: 1, hasMore: false },
        isLoading: false,
        error: null
      });
    }

    // Default
    return JSON.stringify({
      results: [],
      pagination: { total: 0, page: 1, totalPages: 0, hasMore: false },
      isLoading: false,
      error: null
    });
  });
});

afterEach(() => {
  fetchMock.resetMocks();
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
      <span data-testid="results">{JSON.stringify(search.results)}</span>
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
    expect(screen.getByTestId('results').textContent).toBe('[]');

    userEvent.click(screen.getByText('Set Query to an'));
    await act(async () => {
      jest.advanceTimersByTime(300);
      // flush microtasks
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(screen.getByTestId('query').textContent).toBe('an');
      expect(screen.getByTestId('results').textContent).toContain('Banana');
    });
  });

  it('should handle empty initial data', async () => {
    render(<TestComponent initialQuery="" />);
    expect(screen.getByTestId('query').textContent).toBe('');
    expect(screen.getByTestId('results').textContent).toBe('[]');

    userEvent.click(screen.getByText('Set Query to test'));
    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(screen.getByTestId('results').textContent).toBe('[]');
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
      expect(screen.getByTestId('results').textContent).toBe('[]');
    });
  });

  it('should not trim the search term before filtering', async () => {
    render(<TestComponent initialQuery="" />);

    userEvent.click(screen.getByText('Set Query to spaced apple'));
    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(screen.getByTestId('query').textContent).toBe('  apple  ');
      expect(screen.getByTestId('results').textContent).toContain('Apple');
    });
  });
});
