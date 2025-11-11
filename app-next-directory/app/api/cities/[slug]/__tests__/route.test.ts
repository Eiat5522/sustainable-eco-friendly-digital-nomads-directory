/**
 * Jest Test Suite for Cities Slug API Route
 * Tests covering:
 * 1. GET /api/cities/[slug] - Fetch city by slug
 * 2. Error handling for missing cities
 * 3. Error handling for data fetch failures
 * 4. Response structure validation
 */

import { jest, beforeAll, beforeEach, describe, it, expect } from '@jest/globals';
import type { NextRequest } from 'next/server';

// Mock the city data module before importing
jest.mock('@/lib/data/city', () => ({
  __esModule: true,
  getCityBySlug: jest.fn(),
}));

import { getCityBySlug } from '@/lib/data/city';
import { getE2ECityDetail } from '@/data/e2e/discovery-fixtures';

const cityDataMockModule = jest.requireMock('@/lib/data/city') as { getCityBySlug: jest.Mock };

let GET: typeof import('../route').GET;

const mockGetCityBySlug = cityDataMockModule.getCityBySlug;

beforeAll(async () => {
  ({ GET } = await import('../route'));
});

describe('Cities Slug API - GET /api/cities/[slug]', () => {
  beforeEach(() => {
    mockGetCityBySlug.mockReset();
  });

  describe('Successful Requests', () => {
    it('should return city data for valid slug', async () => {
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
      expect(data.data).toEqual(mockCity);
      expect(mockGetCityBySlug).toHaveBeenCalledWith('amsterdam');
      expect(mockGetCityBySlug).toHaveBeenCalledTimes(1);
    });

    it('should return city with optional fields', async () => {
      const mockCity = {
        id: 'city-2',
        name: 'Lisbon',
        slug: 'lisbon',
        country: 'Portugal',
        highlights: [],
        imageUrl: 'https://example.com/lisbon.jpg',
        imageDimensions: { width: 800, height: 600 },
      };
      mockGetCityBySlug.mockResolvedValueOnce(mockCity);

      const request = {} as NextRequest;
      const context = { params: Promise.resolve({ slug: 'lisbon' }) };
      
      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.imageUrl).toBe('https://example.com/lisbon.jpg');
      expect(data.data.imageDimensions).toEqual({ width: 800, height: 600 });
    });

    it('should handle slug with special characters', async () => {
      const mockCity = {
        id: 'city-3',
        name: 'São Paulo',
        slug: 'sao-paulo',
        country: 'Brazil',
        highlights: [],
      };
      mockGetCityBySlug.mockResolvedValueOnce(mockCity);

      const request = {} as NextRequest;
      const context = { params: Promise.resolve({ slug: 'sao-paulo' }) };
      
      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('São Paulo');
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
      expect(data.error).toBe('Failed to fetch city details');
    });

    it('should handle network errors', async () => {
      mockGetCityBySlug.mockRejectedValue(new Error('Network timeout'));

      const request = {} as NextRequest;
      const context = { params: Promise.resolve({ slug: 'lisbon' }) };
      
      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
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
    });
  });

  describe('Sanity configuration fallbacks', () => {
    it('should return fixture city when Sanity configuration is missing', async () => {
      const originalDataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
      const originalProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
      delete process.env.NEXT_PUBLIC_SANITY_DATASET;
      delete process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

      try {
        const fallbackCity = getE2ECityDetail('bangkok');
        expect(fallbackCity).not.toBeNull();

        const request = {} as NextRequest;
        const context = { params: Promise.resolve({ slug: 'bangkok' }) };
        const response = await GET(request, context);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data?.slug).toBe('bangkok');
        expect(mockGetCityBySlug).not.toHaveBeenCalled();
      } finally {
        process.env.NEXT_PUBLIC_SANITY_DATASET = originalDataset;
        process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = originalProjectId;
      }
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
        params: new Promise((resolve) => {
          setTimeout(() => resolve({ slug: 'test-city' }), 10);
        }),
      };
      
      const response = await GET(request, context);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockGetCityBySlug).toHaveBeenCalledWith('test-city');
    });
  });
});
