/**
 * Jest Test Suite for Eco Tags API Route
 * Tests covering:
 * 1. GET /api/eco-tags - Fetch all eco tags from Sanity
 * 2. Error handling for fetch failures
 */

import { jest } from '@jest/globals';
import { GET } from './route';
import { client } from '@/lib/sanity';

// Mock Sanity client
jest.mock('@/lib/sanity', () => ({
  client: {
    fetch: jest.fn(),
  },
}));

describe('Eco Tags API - GET /api/eco-tags', () => {
  let mockedFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedFetch = client.fetch as jest.Mock;
  });

  describe('Successful Requests', () => {
    it('should return all eco tags ordered by name', async () => {
      const mockTags = [
        { _id: '1', name: 'Solar Powered' },
        { _id: '2', name: 'Zero Waste' },
        { _id: '3', name: 'Organic Food' }
      ];
      mockedFetch.mockResolvedValueOnce(mockTags);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ecoTags).toEqual(mockTags);
      expect(data.ecoTags.length).toBe(3);
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when no tags exist', async () => {
      mockedFetch.mockResolvedValueOnce([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ecoTags).toEqual([]);
    });

    it('should use correct GROQ query for eco tags', async () => {
      mockedFetch.mockResolvedValueOnce([]);

      await GET();

      const query = mockedFetch.mock.calls[0][0];
      expect(query).toContain('_type == "ecoTag"');
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
      expect(data.error).toBe('Failed to fetch eco tags');
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle network timeout errors', async () => {
      mockedFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch eco tags');
    });
  });
});
