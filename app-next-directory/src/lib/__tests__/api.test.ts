import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { fetchCityDetails, fetchCityListings } from '../api';

// Mock fetch globally
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('API Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console.error mock
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('fetchCityDetails', () => {
    it('should fetch city details successfully', async () => {
      const mockCityData = {
        id: '1',
        name: 'Bangkok',
        slug: 'bangkok',
        description: 'Capital of Thailand',
        coordinates: { lat: 13.7563, lng: 100.5018 },
      };

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockCityData,
        }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      const result = await fetchCityDetails('bangkok');

      expect(fetch).toHaveBeenCalledWith('/api/cities/bangkok');
      expect(result).toEqual(mockCityData);
    });

    it('should handle fetch error when response is not ok', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await expect(fetchCityDetails('nonexistent')).rejects.toThrow('Failed to fetch city details');
      expect(console.error).toHaveBeenCalledWith('Error fetching city details:', expect.any(Error));
    });

    it('should handle network error', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValue(networkError);

      await expect(fetchCityDetails('bangkok')).rejects.toThrow('Network error');
      expect(console.error).toHaveBeenCalledWith('Error fetching city details:', networkError);
    });

    it('should handle JSON parsing error', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await expect(fetchCityDetails('bangkok')).rejects.toThrow('Invalid JSON');
    });
  });

  describe('fetchCityListings', () => {
    it('should fetch city listings successfully', async () => {
      const mockListingsData = [
        {
          id: '1',
          title: 'Green Cafe',
          slug: 'green-cafe',
          type: 'cafe',
          city: 'Bangkok',
        },
        {
          id: '2',
          title: 'Eco Coworking',
          slug: 'eco-coworking',
          type: 'coworking',
          city: 'Bangkok',
        },
      ];

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            listings: mockListingsData,
            total: 2,
          },
        }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      const result = await fetchCityListings('bangkok');

      expect(fetch).toHaveBeenCalledWith('/api/listings?citySlug=bangkok');
      expect(result).toEqual(mockListingsData);
    });

    it('should handle missing listings data', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {}, // No listings property
        }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      const result = await fetchCityListings('bangkok');

      expect(result).toEqual([]);
    });

    it('should return empty array when response is not ok', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      const result = await fetchCityListings('bangkok');

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error fetching city listings:', expect.any(Error));
    });

    it('should return empty array on network error', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValue(networkError);

      const result = await fetchCityListings('bangkok');

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error fetching city listings:', networkError);
    });

    it('should handle JSON parsing error gracefully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      const result = await fetchCityListings('bangkok');

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error fetching city listings:', expect.any(Error));
    });

    it('should encode special characters in city slug', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { listings: [] },
        }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await fetchCityListings('chiang-mai');

      expect(fetch).toHaveBeenCalledWith('/api/listings?citySlug=chiang-mai');
    });
  });
});
