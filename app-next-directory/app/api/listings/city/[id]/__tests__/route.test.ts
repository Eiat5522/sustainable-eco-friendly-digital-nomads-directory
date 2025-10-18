/**
 * Test Suite for City Listings API Route
 * Tests covering:
 * 1. GET /api/listings/city/[id] - Fetch listings by city ID
 * 2. Error handling for missing cities/listings
 * 3. Response structure validation
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { NextRequest } from 'next/server';

// Mock the getListingsByCityId function
const mockGetListingsByCityId = jest.fn();

jest.mock('@/lib/data/city', () => ({
  __esModule: true,
  getListingsByCityId: mockGetListingsByCityId,
}));

let GET: typeof import('../route').GET;

type RouteContext = {
  params: Promise<{ id: string }>;
};

describe('City Listings API - GET /api/listings/city/[id]', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Dynamically import the route handler
    const importedModule = await import('../route');
    GET = importedModule.GET;
  });

  describe('Successful Requests', () => {
    it('should return listings for a given city ID', async () => {
      const mockListings = [
        {
          id: 'listing-1',
          title: 'Eco Workspace Amsterdam',
          city: 'amsterdam-city-id',
          type: 'coworking',
        },
        {
          id: 'listing-2',
          title: 'Green Hotel Amsterdam',
          city: 'amsterdam-city-id',
          type: 'accommodation',
        },
      ];

      mockGetListingsByCityId.mockResolvedValueOnce(mockListings);

      const request = {} as NextRequest;
      const context: RouteContext = { params: Promise.resolve({ id: 'amsterdam-city-id' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.listings).toEqual(mockListings);
      expect(data.data.listings).toHaveLength(2);
      expect(mockGetListingsByCityId).toHaveBeenCalledWith('amsterdam-city-id');
      expect(mockGetListingsByCityId).toHaveBeenCalledTimes(1);
    });

    it('should handle city with single listing', async () => {
      const mockListings = [
        {
          id: 'listing-1',
          title: 'Only Listing',
          city: 'small-city-id',
          type: 'cafe',
        },
      ];

      mockGetListingsByCityId.mockResolvedValueOnce(mockListings);

      const request = {} as NextRequest;
      const context: RouteContext = { params: Promise.resolve({ id: 'small-city-id' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.listings).toHaveLength(1);
    });

    it('should handle listings with complete data', async () => {
      const mockListings = [
        {
          id: 'listing-1',
          title: 'Complete Listing',
          description: 'Full description',
          city: 'berlin-city-id',
          country: 'Germany',
          type: 'coworking',
          priceRange: '$$',
          ecoScore: 90,
          amenities: ['wifi', 'solar-power'],
          images: ['img1.jpg'],
          location: { lat: 52.52, lng: 13.405 },
        },
      ];

      mockGetListingsByCityId.mockResolvedValueOnce(mockListings);

      const request = {} as NextRequest;
      const context: RouteContext = { params: Promise.resolve({ id: 'berlin-city-id' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.listings[0]).toHaveProperty('location');
      expect(data.data.listings[0].location).toEqual({ lat: 52.52, lng: 13.405 });
    });

    it('should handle city ID with hyphens and numbers', async () => {
      const mockListings = [{ id: '1', title: 'Test' }];
      mockGetListingsByCityId.mockResolvedValueOnce(mockListings);

      const request = {} as NextRequest;
      const context: RouteContext = { params: Promise.resolve({ id: 'test-city-123' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockGetListingsByCityId).toHaveBeenCalledWith('test-city-123');
    });
  });

  describe('Not Found Cases', () => {
    it('should return 404 when no listings found for city', async () => {
      mockGetListingsByCityId.mockResolvedValueOnce([]);

      const request = {} as NextRequest;
      const context: RouteContext = { params: Promise.resolve({ id: 'nonexistent-city' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Listings not found');
    });

    it('should return 404 when getListingsByCityId returns null', async () => {
      mockGetListingsByCityId.mockResolvedValueOnce(null);

      const request = {} as NextRequest;
      const context: RouteContext = { params: Promise.resolve({ id: 'null-city' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Listings not found');
    });

    it('should return 404 when getListingsByCityId returns undefined', async () => {
      mockGetListingsByCityId.mockResolvedValueOnce(undefined);

      const request = {} as NextRequest;
      const context: RouteContext = { params: Promise.resolve({ id: 'undefined-city' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when data fetch fails', async () => {
      mockGetListingsByCityId.mockRejectedValueOnce(new Error('Database error'));

      const request = {} as NextRequest;
      const context: RouteContext = { params: Promise.resolve({ id: 'error-city' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch listings');
    });

    it('should handle Sanity API errors', async () => {
      mockGetListingsByCityId.mockRejectedValueOnce(new Error('Sanity timeout'));

      const request = {} as NextRequest;
      const context: RouteContext = { params: Promise.resolve({ id: 'sanity-error-city' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch listings');
    });

    it('should log error details to console', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetListingsByCityId.mockRejectedValueOnce(new Error('Test error'));

      const request = {} as NextRequest;
      const context: RouteContext = { params: Promise.resolve({ id: 'test-city' }) };

      await GET(request, context);

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('[ERROR] listings/city/[id] API:');
      consoleErrorSpy.mockRestore();
    });

    it('should handle network errors gracefully', async () => {
      mockGetListingsByCityId.mockRejectedValueOnce(new Error('Network timeout'));

      const request = {} as NextRequest;
      const context: RouteContext = { params: Promise.resolve({ id: 'network-city' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('Response Structure', () => {
    it('should return content-type application/json', async () => {
      const mockListings = [{ id: '1', title: 'Test' }];
      mockGetListingsByCityId.mockResolvedValueOnce(mockListings);

      const request = {} as NextRequest;
      const context: RouteContext = { params: Promise.resolve({ id: 'test-city' }) };

      const response = await GET(request, context);

      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should include success flag in response', async () => {
      const mockListings = [{ id: '1', title: 'Test' }];
      mockGetListingsByCityId.mockResolvedValueOnce(mockListings);

      const request = {} as NextRequest;
      const context: RouteContext = { params: Promise.resolve({ id: 'test-city' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('data');
    });

    it('should wrap listings in data.listings property', async () => {
      const mockListings = [{ id: '1', title: 'Test' }];
      mockGetListingsByCityId.mockResolvedValueOnce(mockListings);

      const request = {} as NextRequest;
      const context: RouteContext = { params: Promise.resolve({ id: 'test-city' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(data.data).toHaveProperty('listings');
      expect(Array.isArray(data.data.listings)).toBe(true);
    });
  });

  describe('Async Params Handling', () => {
    it('should correctly await async params', async () => {
      const mockListings = [{ id: '1', title: 'Test' }];
      mockGetListingsByCityId.mockResolvedValueOnce(mockListings);

      const request = {} as NextRequest;
      // Test with async params resolution
      const context: RouteContext = {
        params: new Promise((resolve) => {
          setTimeout(() => resolve({ id: 'async-city' }), 10);
        }),
      };

      const response = await GET(request, context);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockGetListingsByCityId).toHaveBeenCalledWith('async-city');
    });
  });
});
