import { act, renderHook, waitFor } from '@testing-library/react';
import type { SortOption } from '@/types/search';
import { useSearch } from './useSearch';

describe('useSearch', () => {
  const originalFetch = global.fetch;
  const mockFetch = jest.fn<Promise<Response>, Parameters<typeof fetch>>();
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  const createResponse = (payload: unknown, overrides: Partial<Response> = {}) =>
    ({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(payload),
      text: jest.fn().mockResolvedValue(JSON.stringify(payload)),
      ...overrides,
    }) as unknown as Response;

  beforeEach(() => {
    jest.useFakeTimers();
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    logSpy.mockRestore();
    errorSpy.mockRestore();
    global.fetch = originalFetch;
  });

  it('performs debounced searches and fetches suggestions', async () => {
    mockFetch
      .mockResolvedValueOnce(
        createResponse({
          results: [],
          pagination: { total: 0, page: 1, totalPages: 0, hasMore: false },
          error: null,
        })
      )
      .mockResolvedValueOnce(
        createResponse({
          results: [{ name: 'Bangkok Eco Hub' }],
          pagination: { total: 1, page: 1, totalPages: 1, hasMore: false },
          error: null,
        })
      )
      .mockResolvedValueOnce(createResponse(['Bangkok', 'Berlin']));

    const { result } = renderHook(() =>
      useSearch({
        debounceMs: 20,
        initialFilters: { query: '', ecoTags: [], hasDigitalNomadFeatures: false },
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.handleQueryChange('bangkok');
    });

    await act(async () => {
      jest.advanceTimersByTime(25);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.results).toEqual([{ name: 'Bangkok Eco Hub' }]);
      expect(result.current.pagination).toMatchObject({ total: 1, page: 1, totalPages: 1 });
      expect(result.current.suggestions).toEqual(['Bangkok', 'Berlin']);
      expect(result.current.isLoading).toBe(false);
    });

    const [, secondCall] = mockFetch.mock.calls;
    const requestBody = JSON.parse((secondCall?.[1] as RequestInit).body as string);
    expect(requestBody).toMatchObject({ query: 'bangkok', page: 1, limit: 12 });
  });

  it('surfaces API failures as error states', async () => {
    mockFetch
      .mockResolvedValueOnce(
        createResponse({
          results: [],
          pagination: { total: 0, page: 1, totalPages: 0, hasMore: false },
          error: null,
        })
      )
      .mockResolvedValueOnce(
        createResponse(
          {},
          {
            ok: false,
            status: 500,
            text: jest.fn().mockResolvedValue('Server exploded'),
          }
        )
      )
      .mockResolvedValueOnce(createResponse([]));

    const { result } = renderHook(() =>
      useSearch({
        debounceMs: 20,
        initialFilters: { query: '', ecoTags: [], hasDigitalNomadFeatures: false },
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      result.current.handleQueryChange('error-case');
    });

    await act(async () => {
      jest.advanceTimersByTime(25);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Search request failed');
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('normalises malformed responses and resets filters and sort', async () => {
    mockFetch.mockResolvedValue(
      createResponse({ results: 'unexpected', pagination: undefined, error: null })
    );

    const initialFilters = {
      query: 'initial',
      ecoTags: ['solar'],
      hasDigitalNomadFeatures: true,
    };
    const initialSort: SortOption = { field: 'price', direction: 'asc', label: 'Price' };

    const { result } = renderHook(() =>
      useSearch({
        debounceMs: 10,
        initialFilters,
        initialSort,
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.results).toEqual([]);

    await act(async () => {
      result.current.handleFiltersChange({ city: 'Lisbon' });
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.filters.city).toBe('Lisbon');

    await act(async () => {
      result.current.handleSortChange({ field: 'rating', direction: 'desc', label: 'Rating' });
      result.current.handlePageChange(3);
    });

    expect(result.current.sort).toMatchObject({ field: 'rating', direction: 'desc' });
    expect(result.current.page).toBe(3);

    await act(async () => {
      result.current.clearFilters();
    });

    expect(result.current.filters).toEqual(initialFilters);
    expect(result.current.sort).toBeUndefined();
  });
});
