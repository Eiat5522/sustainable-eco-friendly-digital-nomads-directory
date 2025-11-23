import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { searchListings } from '../client';

describe('client', () => {
  beforeEach(() => {
    // Reset the global.fetch mock before each test
    global.fetch = jest.fn() as any;
  });

  describe('searchListings', () => {
    it('should return listings on successful search', async () => {
      const mockListings = [
        { id: '1', title: 'Listing 1' },
        { id: '2', title: 'Listing 2' },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockListings,
      });

      const result = await searchListings('test query');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/search',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ query: 'test query' }),
        })
      );
      expect(result).toEqual(mockListings);
    });

    it('should return empty array when response is not ok', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await searchListings('test query');

      expect(result).toEqual([]);
    });

    it('should return empty array on network error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await searchListings('test query');

      expect(result).toEqual([]);
    });

    it('should return empty array on JSON parse error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const result = await searchListings('test query');

      expect(result).toEqual([]);
    });

    it('should handle empty query string', async () => {
      const mockListings: never[] = [];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockListings,
      });

      const result = await searchListings('');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/search',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ query: '' }),
        })
      );
      expect(result).toEqual([]);
    });

    it('should handle special characters in query', async () => {
      const specialQuery = 'café & "quotes" <html>';
      const mockListings = [{ id: '1', title: 'Result' }];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockListings,
      });

      const result = await searchListings(specialQuery);

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/search',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ query: specialQuery }),
        })
      );
      expect(result).toEqual(mockListings);
    });

    it('should handle very long query strings', async () => {
      const longQuery = 'a'.repeat(1000);
      const mockListings: never[] = [];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockListings,
      });

      const result = await searchListings(longQuery);

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/search',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ query: longQuery }),
        })
      );
      expect(result).toEqual([]);
    });
  });
});
