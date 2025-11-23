/**
 * Jest Test Suite for Digital Nomad Features API Route
 * Tests covering:
 * 1. GET /api/digital-nomad-features - Fetch all digital nomad features from Sanity
 * 2. Error handling for fetch failures
 */

import { jest } from '@jest/globals';
import { client } from '@/lib/sanity';
import { GET } from './route';

// Mock Sanity client
jest.mock('@/lib/sanity', () => ({
  client: {
    fetch: jest.fn(),
  },
}));

describe('Digital Nomad Features API - GET /api/digital-nomad-features', () => {
  let mockedFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedFetch = client.fetch as jest.Mock;
  });

  describe('Successful Requests', () => {
    it('should return all digital nomad features ordered by name', async () => {
      const mockFeatures = [
        { _id: '1', name: 'Co-working Space' },
        { _id: '2', name: 'High-Speed Internet' },
        { _id: '3', name: 'Meeting Rooms' },
      ];
      mockedFetch.mockResolvedValueOnce(mockFeatures);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.digitalNomadFeatures).toEqual(mockFeatures);
      expect(data.digitalNomadFeatures.length).toBe(3);
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when no features exist', async () => {
      mockedFetch.mockResolvedValueOnce([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.digitalNomadFeatures).toEqual([]);
    });

    it('should use correct GROQ query for digital nomad features', async () => {
      mockedFetch.mockResolvedValueOnce([]);

      await GET();

      const query = mockedFetch.mock.calls[0][0];
      expect(query).toContain('_type == "nomadFeature"');
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
      expect(data.error).toBe('Failed to fetch digital nomad features');
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle network timeout errors', async () => {
      mockedFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch digital nomad features');
    });
  });
});
