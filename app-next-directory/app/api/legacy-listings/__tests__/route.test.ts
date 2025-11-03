/**
 * Test Suite for Legacy Listings API Route
 * Tests covering:
 * 1. GET /api/legacy-listings - Fetch legacy listings from JSON file
 * 2. Error handling for file read failures
 * 3. Response structure validation
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock fs module
const mockReadFile = jest.fn();
jest.mock('fs', () => ({
  promises: {
    readFile: mockReadFile,
  },
}));

let GET: typeof import('../route').GET;

describe('Legacy Listings API - GET /api/legacy-listings', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Dynamically import the route handler
    const routeModule = await import('../route');
    GET = routeModule.GET;
  });

  describe('Successful Requests', () => {
    it('should return listings from JSON file', async () => {
      const mockListings = [
        {
          id: 'listing-1',
          title: 'Eco Workspace',
          city: 'Amsterdam',
          type: 'coworking',
        },
        {
          id: 'listing-2',
          title: 'Green Hotel',
          city: 'Berlin',
          type: 'accommodation',
        },
      ];

      mockReadFile.mockResolvedValueOnce(JSON.stringify(mockListings));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.listings).toEqual(mockListings);
      expect(data.data.listings).toHaveLength(2);
      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith(
        expect.stringContaining('src/data/listings.json'),
        'utf8'
      );
    });

    it('should return empty array when listings file is empty', async () => {
      mockReadFile.mockResolvedValueOnce('[]');

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.listings).toEqual([]);
      expect(data.data.listings).toHaveLength(0);
    });

    it('should handle listings with all properties', async () => {
      const mockListings = [
        {
          id: 'listing-1',
          title: 'Complete Listing',
          description: 'A complete listing with all properties',
          city: 'Barcelona',
          country: 'Spain',
          type: 'coworking',
          priceRange: '$$',
          ecoScore: 95,
          amenities: ['wifi', 'solar-power', 'recycling'],
          images: ['image1.jpg', 'image2.jpg'],
        },
      ];

      mockReadFile.mockResolvedValueOnce(JSON.stringify(mockListings));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.listings[0]).toHaveProperty('id', 'listing-1');
      expect(data.data.listings[0]).toHaveProperty('title', 'Complete Listing');
      expect(data.data.listings[0]).toHaveProperty('amenities');
      expect(data.data.listings[0].amenities).toHaveLength(3);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 error when file read fails', async () => {
      mockReadFile.mockRejectedValueOnce(new Error('File not found'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to load listings');
    });

    it('should return 500 error when JSON parsing fails', async () => {
      mockReadFile.mockResolvedValueOnce('invalid json {');

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to load listings');
    });

    it('should handle file read permission errors', async () => {
      mockReadFile.mockRejectedValueOnce(new Error('EACCES: permission denied'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to load listings');
    });

    it('should log error when file read fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockReadFile.mockRejectedValueOnce(new Error('File read error'));

      await GET();

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('Error reading legacy listings');
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Response Structure', () => {
    it('should return content-type application/json', async () => {
      mockReadFile.mockResolvedValueOnce('[]');

      const response = await GET();

      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should include success flag in response', async () => {
      mockReadFile.mockResolvedValueOnce('[]');

      const response = await GET();
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('data');
    });

    it('should wrap listings in data.listings property', async () => {
      const mockListings = [{ id: '1', title: 'Test' }];
      mockReadFile.mockResolvedValueOnce(JSON.stringify(mockListings));

      const response = await GET();
      const data = await response.json();

      expect(data.data).toHaveProperty('listings');
      expect(Array.isArray(data.data.listings)).toBe(true);
    });
  });
});
