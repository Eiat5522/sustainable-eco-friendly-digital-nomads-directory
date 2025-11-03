/**
 * @jest-environment node
 */

/**
 * Jest Test Suite for Cities API Route
 * Tests covering:
 * 1. GET /api/cities - Fetch city summaries via the data layer
 * 2. Error handling for data fetch failures
 * 3. Response structure validation
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

const mockGetCitiesList = jest.fn();

jest.mock('@/lib/data/city', () => ({
  getCitiesList: (...args: unknown[]) => mockGetCitiesList(...args),
}));

let GET: any;
let routeTestControl: any;

describe('Cities API - GET /api/cities', () => {
  beforeEach(async () => {
    jest.resetModules();
    mockGetCitiesList.mockReset();
    const routeModule = await import('../route');
    GET = routeModule.GET;
    routeTestControl = routeModule.testControl;
  });

  afterEach(() => {
    if (routeTestControl) {
      routeTestControl.fetchCitiesOverride = undefined;
    }
  });

  describe('Successful Requests', () => {
    it('returns the city list from the data fetcher', async () => {
      const mockCities = [
        { id: '1', name: 'Amsterdam', slug: 'amsterdam', country: 'Netherlands' },
        { id: '2', name: 'Bangkok', slug: 'bangkok', country: 'Thailand' },
        { id: '3', name: 'Lisbon', slug: 'lisbon', country: 'Portugal' },
      ];
      mockGetCitiesList.mockResolvedValueOnce(mockCities);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cities).toEqual(mockCities);
      expect(data.cities.length).toBe(3);
      expect(mockGetCitiesList).toHaveBeenCalledTimes(1);
    });

    it('should forward query limit to the fetcher', async () => {
      mockGetCitiesList.mockResolvedValueOnce([]);

      await GET();
      expect(mockGetCitiesList).toHaveBeenCalledWith(8);
    });

    it('should return an empty array when no cities exist', async () => {
      mockGetCitiesList.mockResolvedValueOnce([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cities).toEqual([]);
      expect(mockGetCitiesList).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on data fetch failure', async () => {
      mockGetCitiesList.mockRejectedValue(new Error('Sanity Error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch cities');
      expect(mockGetCitiesList).toHaveBeenCalledTimes(1);
    });

    it('should handle network timeout errors', async () => {
      mockGetCitiesList.mockRejectedValue(new Error('Network timeout'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch cities');
    });

    it('should handle undefined response from Sanity', async () => {
      const override = jest.fn().mockResolvedValueOnce(undefined);
      routeTestControl.fetchCitiesOverride = override;

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cities).toBeUndefined();
    });

    it('should handle null response from Sanity', async () => {
      const override = jest.fn().mockResolvedValueOnce(null);
      routeTestControl.fetchCitiesOverride = override;

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cities).toBeNull();
    });
  });

  describe('Response Structure', () => {
    it('should return cities with correct structure', async () => {
      const mockCities = [
        { id: 'city-1', name: 'Tokyo', slug: 'tokyo', country: 'Japan' },
        { id: 'city-2', name: 'Berlin', slug: 'berlin', country: 'Germany' },
      ];
      mockGetCitiesList.mockResolvedValueOnce(mockCities);

      const response = await GET();
      const data = await response.json();

      expect(data).toHaveProperty('cities');
      expect(Array.isArray(data.cities)).toBe(true);
      data.cities.forEach((city: any) => {
        expect(city).toHaveProperty('id');
        expect(city).toHaveProperty('slug');
      });
    });

    it('should return content-type application/json', async () => {
      mockGetCitiesList.mockResolvedValueOnce([]);

      const response = await GET();

      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });
});
