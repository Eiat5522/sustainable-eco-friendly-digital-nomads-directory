/**
 * Jest Test Suite for City Slug API Route
 * Tests covering:
 * 1. GET /api/city/[slug] - Fetch city by slug with wrapped response
 * 2. Error handling for missing cities
 * 3. Error handling for data fetch failures
 * 4. Response structure validation (wrapped in city object)
 */

import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { NextRequest } from 'next/server';

// Mock the city data module before importing
jest.mock('@/lib/data/city', () => ({
  __esModule: true,
  getCityBySlug: jest.fn(),
}));

// Mock the logger module
jest.mock('@/lib/logger', () => ({
  __esModule: true,
  structuredLogger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));


const cityDataMockModule = jest.requireMock('@/lib/data/city') as { getCityBySlug: jest.Mock };
const loggerMockModule = jest.requireMock('@/lib/logger') as {
  structuredLogger: { error: jest.Mock; warn: jest.Mock; info: jest.Mock };
};

let GET: typeof import('../route').GET;

const mockGetCityBySlug = cityDataMockModule.getCityBySlug;
const mockLogger = loggerMockModule.structuredLogger;

beforeAll(async () => {
  ({ GET } = await import('../route'));
});

describe('City Slug API - GET /api/city/[slug]', () => {
  beforeEach(() => {
    mockGetCityBySlug.mockReset();
    mockLogger.error.mockClear();
  });

  describe('Successful Requests', () => {
    it('should return city data wrapped in city object', async () => {
      const mockCity = {
        id: 'city-1',
        name: 'Amsterdam',
        slug: 'amsterdam',
        country: 'Netherlands',
        sustainabilityScore: 85,
        highlights: ['Green transportation', 'Bike-friendly'],
        description: 'A sustainable city with great infrastructure',
      };
      mockGetCityBySlug.mockResolvedValueOnce(mockCity);

      const request = {} as NextRequest;
      const context = { params: Promise.resolve({ slug: 'amsterdam' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('city');
      expect(data.data.city).toEqual(mockCity);
      expect(mockGetCityBySlug).toHaveBeenCalledWith('amsterdam');
      expect(mockGetCityBySlug).toHaveBeenCalledTimes(1);
    });

    it('should return city with optional fields', async () => {
      const mockCity = {
        id: 'city-2',
        name: 'Tokyo',
        slug: 'tokyo',
        country: 'Japan',
        highlights: ['Tech hub', 'Efficient transit'],
        imageUrl: 'https://example.com/tokyo.jpg',
        imageDimensions: { width: 1200, height: 800 },
        sustainabilityScore: 78,
      };
      mockGetCityBySlug.mockResolvedValueOnce(mockCity);

      const request = {} as NextRequest;
      const context = { params: Promise.resolve({ slug: 'tokyo' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.city.imageUrl).toBe('https://example.com/tokyo.jpg');
      expect(data.data.city.imageDimensions).toEqual({ width: 1200, height: 800 });
      expect(data.data.city.sustainabilityScore).toBe(78);
    });

    it('should handle slug with hyphens', async () => {
      const mockCity = {
        id: 'city-3',
        name: 'Buenos Aires',
        slug: 'buenos-aires',
        country: 'Argentina',
        highlights: ['Cultural richness', 'Affordable'],
      };
      mockGetCityBySlug.mockResolvedValueOnce(mockCity);

      const request = {} as NextRequest;
      const context = { params: Promise.resolve({ slug: 'buenos-aires' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.city.name).toBe('Buenos Aires');
      expect(data.data.city.slug).toBe('buenos-aires');
    });

    it('should handle city with minimal data', async () => {
      const mockCity = {
        id: 'city-4',
        name: 'Minimal City',
        slug: 'minimal-city',
        country: 'TestLand',
        highlights: [],
      };
      mockGetCityBySlug.mockResolvedValueOnce(mockCity);

      const request = {} as NextRequest;
      const context = { params: Promise.resolve({ slug: 'minimal-city' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.city.highlights).toEqual([]);
    });
  });

  describe('Not Found Cases', () => {
    it('should return 404 when city is not found', async () => {
      mockGetCityBySlug.mockResolvedValueOnce(null);

      const request = {} as NextRequest;
      const context = { params: Promise.resolve({ slug: 'nonexistent-city' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('City not found');
      expect(mockGetCityBySlug).toHaveBeenCalledWith('nonexistent-city');
    });

    it('should return 404 for invalid slug format', async () => {
      mockGetCityBySlug.mockResolvedValueOnce(null);

      const request = {} as NextRequest;
      const context = { params: Promise.resolve({ slug: 'invalid_slug_format' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('City not found');
    });

    it('should return 404 for empty slug', async () => {
      mockGetCityBySlug.mockResolvedValueOnce(null);

      const request = {} as NextRequest;
      const context = { params: Promise.resolve({ slug: '' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on data fetch failure', async () => {
      mockGetCityBySlug.mockRejectedValue(new Error('Database error'));

      const request = {} as NextRequest;
      const context = { params: Promise.resolve({ slug: 'amsterdam' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch city');
    });

    it('should handle Sanity API errors', async () => {
      mockGetCityBySlug.mockRejectedValue(new Error('Sanity API timeout'));

      const request = {} as NextRequest;
      const context = { params: Promise.resolve({ slug: 'lisbon' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch city');
    });

    it('should handle network errors gracefully', async () => {
      mockGetCityBySlug.mockRejectedValue(new Error('Network timeout'));

      const request = {} as NextRequest;
      const context = { params: Promise.resolve({ slug: 'berlin' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should log error details to console', async () => {
      mockGetCityBySlug.mockRejectedValue(new Error('Test error'));

      const request = {} as NextRequest;
      const context = { params: Promise.resolve({ slug: 'test-city' }) };

      await GET(request, context);

      expect(mockLogger.error).toHaveBeenCalled();
      const callArgs = mockLogger.error.mock.calls[0];
      expect(callArgs[0]).toContain('GET /api/city/[slug] failed');
    });

    it('should include slug in error log', async () => {
      mockGetCityBySlug.mockRejectedValue(new Error('Test error'));

      const request = {} as NextRequest;
      const context = { params: Promise.resolve({ slug: 'error-city' }) };

      await GET(request, context);

      expect(mockLogger.error).toHaveBeenCalled();
      const callArgs = mockLogger.error.mock.calls[0];
      expect(callArgs[2]).toHaveProperty('slug', 'error-city');
    });
  });

  describe('Response Structure', () => {
    it('should return content-type application/json', async () => {
      mockGetCityBySlug.mockResolvedValueOnce({
        id: 'city-1',
        name: 'Test City',
        slug: 'test-city',
        country: 'Test Country',
        highlights: [],
      });

      const request = {} as NextRequest;
      const context = { params: Promise.resolve({ slug: 'test-city' }) };

      const response = await GET(request, context);

      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should include success flag in response', async () => {
      mockGetCityBySlug.mockResolvedValueOnce({
        id: 'city-1',
        name: 'Test City',
        slug: 'test-city',
        country: 'Test Country',
        highlights: [],
      });

      const request = {} as NextRequest;
      const context = { params: Promise.resolve({ slug: 'test-city' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('data');
    });

    it('should wrap city data in city property', async () => {
      const mockCity = {
        id: 'city-1',
        name: 'Test City',
        slug: 'test-city',
        country: 'Test Country',
        highlights: [],
      };
      mockGetCityBySlug.mockResolvedValueOnce(mockCity);

      const request = {} as NextRequest;
      const context = { params: Promise.resolve({ slug: 'test-city' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(data.data).toHaveProperty('city');
      expect(data.data.city).toEqual(mockCity);
      expect(data.data.city).not.toBe(data.data); // Ensure it's wrapped
    });
  });

  describe('Async Params Handling', () => {
    it('should correctly await async params', async () => {
      const mockCity = {
        id: 'city-1',
        name: 'Test City',
        slug: 'test-city',
        country: 'Test Country',
        highlights: [],
      };
      mockGetCityBySlug.mockResolvedValueOnce(mockCity);

      const request = {} as NextRequest;
      // Test with async params resolution
      const context = {
        params: new Promise(resolve => {
          setTimeout(() => resolve({ slug: 'test-city' }), 10);
        }),
      };

      const response = await GET(request, context);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.city).toEqual(mockCity);
      expect(mockGetCityBySlug).toHaveBeenCalledWith('test-city');
    });

    it('should handle params resolution before fetching data', async () => {
      const mockCity = {
        id: 'city-1',
        name: 'Async City',
        slug: 'async-city',
        country: 'Async Country',
        highlights: [],
      };
      mockGetCityBySlug.mockResolvedValueOnce(mockCity);

      const request = {} as NextRequest;
      const context = { params: Promise.resolve({ slug: 'async-city' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockGetCityBySlug).toHaveBeenCalledWith('async-city');
    });
  });
});
