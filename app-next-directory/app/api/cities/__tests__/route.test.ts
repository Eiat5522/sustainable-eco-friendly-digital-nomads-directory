/**
 * Jest Test Suite for Cities API Route
 * Tests covering:
 * 1. GET /api/cities - Fetch all cities ordered by name
 * 2. Error handling for Sanity client failures
 * 3. Response structure validation
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { GET, testControl } from '../route';

describe('Cities API - GET /api/cities', () => {
  const mockedFetch = jest.fn();

  beforeEach(async () => {
    mockedFetch.mockReset();
    testControl.clientFetchOverride = mockedFetch;
  });

  afterEach(() => {
    testControl.clientFetchOverride = undefined;
  });

  describe('Successful Requests', () => {
    it('should return all cities ordered by name', async () => {
      const mockCities = [
        { _id: '1', name: 'Amsterdam' },
        { _id: '2', name: 'Bangkok' },
        { _id: '3', name: 'Lisbon' },
      ];
      mockedFetch.mockResolvedValueOnce(mockCities);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cities).toEqual(mockCities);
      expect(data.cities.length).toBe(3);
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when no cities exist', async () => {
      mockedFetch.mockResolvedValueOnce([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cities).toEqual([]);
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    it('should call Sanity with correct GROQ query', async () => {
      mockedFetch.mockResolvedValueOnce([]);

      await GET();

      const query = mockedFetch.mock.calls[0][0];
      expect(query).toContain('*[_type == "city"]');
      expect(query).toContain('order(name asc)');
      expect(query).toContain('_id');
      expect(query).toContain('name');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on Sanity fetch failure', async () => {
      mockedFetch.mockRejectedValue(new Error('Sanity Error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch cities');
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle network timeout errors', async () => {
      mockedFetch.mockRejectedValue(new Error('Network timeout'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch cities');
    });

    it('should handle undefined response from Sanity', async () => {
      mockedFetch.mockResolvedValueOnce(undefined);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cities).toBeUndefined();
    });

    it('should handle null response from Sanity', async () => {
      mockedFetch.mockResolvedValueOnce(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cities).toBeNull();
    });
  });

  describe('Response Structure', () => {
    it('should return cities with correct structure', async () => {
      const mockCities = [
        { _id: 'city-1', name: 'Tokyo' },
        { _id: 'city-2', name: 'Berlin' },
      ];
      mockedFetch.mockResolvedValueOnce(mockCities);

      const response = await GET();
      const data = await response.json();

      expect(data).toHaveProperty('cities');
      expect(Array.isArray(data.cities)).toBe(true);
      data.cities.forEach((city: any) => {
        expect(city).toHaveProperty('_id');
        expect(city).toHaveProperty('name');
      });
    });

    it('should return content-type application/json', async () => {
      mockedFetch.mockResolvedValueOnce([]);

      const response = await GET();
      
      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });
});
