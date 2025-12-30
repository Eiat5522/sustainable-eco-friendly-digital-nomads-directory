/**
 * Jest Test Suite for Amenities API Route
 * Tests covering:
 * 1. GET /api/amenities - Fetch all amenities from Sanity
 * 2. Error handling for fetch failures
 */

import { jest } from '@jest/globals';
import { getClient } from '@/lib/sanity';
import { GET } from './route';

// Mock Sanity client
jest.mock('@/lib/sanity', () => ({
  getClient: jest.fn(() => ({
    fetch: jest.fn(),
  })),
}));

// Also mock the cache helpers to avoid caching issues in tests
jest.mock('@/lib/cache-strategy', () => ({
  cacheHelpers: {
    amenities: jest.fn(fn => fn()),
  },
}));

const mockedGetClient = getClient as jest.MockedFunction<typeof getClient>;

describe('Amenities API - GET /api/amenities', () => {
  let mockedFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedFetch = jest.fn();
    mockedGetClient.mockReturnValue({ fetch: mockedFetch } as any);
  });

  describe('Successful Requests', () => {
    it('should return all amenities ordered by name', async () => {
      const mockAmenities = [
        { _id: '1', name: 'Air Conditioning' },
        { _id: '2', name: 'WiFi' },
        { _id: '3', name: 'Parking' },
      ];
      mockedFetch.mockResolvedValueOnce(mockAmenities);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.amenities).toEqual(mockAmenities);
      expect(data.amenities.length).toBe(3);
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when no amenities exist', async () => {
      mockedFetch.mockResolvedValueOnce([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.amenities).toEqual([]);
    });

    it('should use correct GROQ query for amenities', async () => {
      mockedFetch.mockResolvedValueOnce([]);

      await GET();

      const query = mockedFetch.mock.calls[0][0];
      expect(query).toContain('_type == "amenity"');
      expect(query).toContain('order(name asc)');
      expect(query).toContain('_id');
      expect(query).toContain('name');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database fetch failure', async () => {
      mockedFetch.mockRejectedValueOnce(new Error('Sanity fetch error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch amenities');
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle network timeout errors', async () => {
      mockedFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch amenities');
    });
  });
});
