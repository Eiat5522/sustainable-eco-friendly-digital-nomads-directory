/**
 * Jest Test Suite for Categories API Route
 * Tests covering:
 * 1. GET /api/categories - Fetch all categories from Sanity
 * 2. Fallback to default categories on error
 * 3. Error handling
 */

import { jest } from '@jest/globals';
import { DEFAULT_CATEGORIES } from '@/lib/constants/categories';
import { client } from '@/lib/sanity/client';
import { GET } from './route';

// Mock Sanity client
jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: jest.fn(),
  },
}));

// Mock constants
jest.mock('@/lib/constants/categories', () => ({
  DEFAULT_CATEGORIES: ['Coworking', 'Accommodation', 'Cafe', 'Restaurant'],
}));

describe('Categories API - GET /api/categories', () => {
  let mockedFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedFetch = client.fetch as jest.Mock;
  });

  describe('Successful Requests', () => {
    it('should return categories from CMS', async () => {
      const mockCategories = ['Coworking', 'Accommodation', 'Cafe', 'Restaurant', 'Hotel'];
      mockedFetch.mockResolvedValueOnce(mockCategories);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.categories).toEqual(mockCategories);
      expect(data.data.categories.length).toBe(5);
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    it('should use correct GROQ query for categories', async () => {
      mockedFetch.mockResolvedValueOnce(['Coworking']);

      await GET();

      const query = mockedFetch.mock.calls[0][0];
      expect(query).toContain('_type == "listing"');
      expect(query).toContain('defined(category)');
      expect(query).toContain('array::unique');
    });
  });

  describe('Fallback Handling', () => {
    it('should return default categories when CMS returns empty array', async () => {
      mockedFetch.mockResolvedValueOnce([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.categories).toEqual(DEFAULT_CATEGORIES);
    });

    it('should return default categories when CMS returns null', async () => {
      mockedFetch.mockResolvedValueOnce(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.categories).toEqual(DEFAULT_CATEGORIES);
    });

    it('should return default categories when CMS returns undefined', async () => {
      mockedFetch.mockResolvedValueOnce(undefined);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.categories).toEqual(DEFAULT_CATEGORIES);
    });
  });

  describe('Error Handling', () => {
    it('should return default categories on database fetch failure', async () => {
      mockedFetch.mockRejectedValueOnce(new Error('Sanity fetch error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.categories).toEqual(DEFAULT_CATEGORIES);
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle network timeout errors with fallback', async () => {
      mockedFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.categories).toEqual(DEFAULT_CATEGORIES);
    });

    it('should handle error with status code', async () => {
      const error = new Error('Sanity error') as any;
      error.status = 503;
      mockedFetch.mockRejectedValueOnce(error);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.categories).toEqual(DEFAULT_CATEGORIES);
    });
  });
});
