import { renderHook, act } from '@testing-library/react';
import { useSearchListings } from './useSearchListings';

describe('useSearchListings', () => {
  const originalFetch = global.fetch;
  const mockFetch = jest.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('posts a search request and normalizes the response payload', async () => {
    const responsePayload = {
      results: [
        { id: '1', title: 'Eco Hub' },
        { id: '2', title: 'Green Cafe' },
      ],
      total: '5',
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(responsePayload),
    } as unknown as Response);

    const { result } = renderHook(() => useSearchListings());

    await act(async () => {
      await result.current.searchListings({ query: 'eco', page: 1, limit: 1 });
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/search',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const requestBody = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
    expect(requestBody).toMatchObject({ query: 'eco', category: '', page: 1, limit: 1 });

    expect(result.current.listings).toHaveLength(2);
    expect(result.current.totalCount).toBe(5);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('surfaces HTTP errors and clears stale search results', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn(),
    } as unknown as Response);

    const { result } = renderHook(() => useSearchListings());

    await act(async () => {
      await result.current.searchListings({ query: 'fails' });
    });

    expect(result.current.error).toBe('Search request failed with status 500');
    expect(result.current.listings).toEqual([]);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('coerces loosely typed responses and falls back when data is missing', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        results: 'not-an-array',
        count: '3',
        pagination: { hasMore: true, total: 'ignored' },
      }),
    } as unknown as Response);

    const { result } = renderHook(() => useSearchListings({ query: 'initial', page: 2 }));

    await act(async () => {
      await result.current.searchListings();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/search',
      expect.objectContaining({
        body: JSON.stringify({
          query: 'initial',
          category: '',
          filters: {},
          page: 2,
          limit: 12,
        }),
      })
    );

    expect(result.current.listings).toEqual([]);
    expect(result.current.totalCount).toBe(3);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.error).toBeNull();
  });
});
