/**
 * Unit tests for favorites.dal.ts
 * Tests the Data Access Layer for user-specific favorite data
 */

import { jest } from '@jest/globals';
import type { Collection } from 'mongodb';
import { checkIsFavorited, getListingReviews } from '../favorites.dal';

// Mock dependencies
jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: jest.fn(),
    withConfig: jest.fn(() => ({
      fetch: jest.fn(),
    })),
  },
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('next/cache', () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  structuredLogger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('@/utils/db-helpers', () => ({
  getCollection: jest.fn(),
}));

// Import mocked modules
import { cookies } from 'next/headers';
import { structuredLogger } from '@/lib/logger';
import { client } from '@/lib/sanity/client';
import { getCollection } from '@/utils/db-helpers';

const mockCookies = cookies as jest.MockedFunction<typeof cookies>;
const mockFetch = client.fetch as jest.MockedFunction<typeof client.fetch>;
const mockGetCollection = getCollection as jest.MockedFunction<typeof getCollection>;

describe('favorites.dal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkIsFavorited', () => {
    it('should return false if userId is not provided', async () => {
      const result = await checkIsFavorited('listing-1', undefined);

      expect(result).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return false if no session cookie exists', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue(null),
      };

      mockCookies.mockResolvedValueOnce(mockCookieStore as never);

      const result = await checkIsFavorited('listing-1', 'user-1');

      expect(result).toBe(false);
      expect(mockCookieStore.get).toHaveBeenCalledWith('session');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return true if listing is favorited', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'session-token' }),
      };

      mockCookies.mockResolvedValueOnce(mockCookieStore as never);
      mockFetch.mockResolvedValueOnce({ _id: 'favorite-1' });

      const result = await checkIsFavorited('listing-1', 'user-1');

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(expect.any(String), {
        userId: 'user-1',
        listingId: 'listing-1',
      });
    });

    it('should return false if listing is not favorited', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'session-token' }),
      };

      mockCookies.mockResolvedValueOnce(mockCookieStore as never);
      mockFetch.mockResolvedValueOnce(null);

      const result = await checkIsFavorited('listing-1', 'user-1');

      expect(result).toBe(false);
    });

    it('should handle cookies() throwing an error', async () => {
      mockCookies.mockRejectedValueOnce(new Error('Cookies error'));

      const result = await checkIsFavorited('listing-1', 'user-1');

      expect(result).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle fetch errors gracefully', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'session-token' }),
      };

      mockCookies.mockResolvedValueOnce(mockCookieStore as never);
      mockFetch.mockRejectedValueOnce(new Error('Fetch failed'));

      const result = await checkIsFavorited('listing-1', 'user-1');

      expect(result).toBe(false);
      expect(structuredLogger.error).toHaveBeenCalledWith(
        'Failed to check favorite status',
        expect.any(Error),
        expect.objectContaining({ listingId: 'listing-1', userId: 'user-1' })
      );
    });
  });

  describe('getListingReviews', () => {
    it('should fetch approved reviews for anonymous users', async () => {
      const mockReviews = [
        {
          _id: 'review-1',
          rating: 5,
          comment: 'Great place!',
          status: 'approved',
          createdAt: new Date('2024-01-01'),
          listingSlug: 'test-listing',
          user: { name: 'John Doe', image: 'https://example.com/avatar.jpg' },
        },
        {
          _id: 'review-2',
          rating: 4,
          comment: 'Good experience',
          status: 'approved',
          createdAt: new Date('2024-01-02'),
          listingSlug: 'test-listing',
          user: { name: 'Jane Smith' },
        },
      ];

      const mockCollection = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(mockReviews),
      };

      mockGetCollection.mockResolvedValueOnce(mockCollection as unknown as Collection);

      const result = await getListingReviews('test-listing');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'review-1',
        rating: 5,
        comment: 'Great place!',
        status: 'approved',
        user: { name: 'John Doe', image: 'https://example.com/avatar.jpg' },
      });
      expect(mockCollection.find).toHaveBeenCalledWith({
        listingSlug: 'test-listing',
        status: 'approved',
      });
    });

    it('should fetch approved and own pending reviews for authenticated users', async () => {
      const mockReviews = [
        {
          _id: 'review-1',
          rating: 5,
          comment: 'Great place!',
          status: 'approved',
          createdAt: new Date('2024-01-01'),
          listingSlug: 'test-listing',
          user: { name: 'John Doe' },
        },
        {
          _id: 'review-2',
          rating: 4,
          comment: 'Awaiting approval',
          status: 'pending',
          createdAt: new Date('2024-01-02'),
          listingSlug: 'test-listing',
          user: 'user-1',
        },
      ];

      const mockCollection = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(mockReviews),
      };

      mockGetCollection.mockResolvedValueOnce(mockCollection as unknown as Collection);

      const result = await getListingReviews('test-listing', 'user-1');

      expect(result).toHaveLength(2);
      expect(result[1]).toMatchObject({
        id: 'review-2',
        rating: 4,
        status: 'pending',
      });
      expect(mockCollection.find).toHaveBeenCalledWith({
        listingSlug: 'test-listing',
        $or: [{ status: 'approved' }, { status: 'pending', user: 'user-1' }],
      });
    });

    it('should handle reviews with missing or invalid data', async () => {
      const mockReviews = [
        {
          _id: 'review-1',
          rating: 5,
          comment: 'Valid review',
          status: 'approved',
          createdAt: new Date('2024-01-01'),
          listingSlug: 'test-listing',
          user: { name: 'John Doe' },
        },
        {
          // Invalid: no _id or id
          rating: 4,
          comment: 'No ID',
          status: 'approved',
          createdAt: new Date('2024-01-02'),
          listingSlug: 'test-listing',
          user: { name: 'Jane Smith' },
        },
        {
          _id: 'review-3',
          rating: 'invalid', // Invalid rating
          comment: 'Invalid rating',
          status: 'approved',
          createdAt: new Date('2024-01-03'),
          listingSlug: 'test-listing',
          user: { name: 'Bob Jones' },
        },
        {
          _id: 'review-4',
          rating: 3,
          comment: 'Valid review',
          status: 'approved',
          createdAt: new Date('2024-01-04'),
          listingSlug: 'test-listing',
          user: { name: 'Alice Brown' },
        },
      ];

      const mockCollection = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(mockReviews),
      };

      mockGetCollection.mockResolvedValueOnce(mockCollection as unknown as Collection);

      const result = await getListingReviews('test-listing');

      // Should only return valid reviews (review-1 and review-4)
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('review-1');
      expect(result[1].id).toBe('review-4');
    });

    it('should use Anonymous as default username', async () => {
      const mockReviews = [
        {
          _id: 'review-1',
          rating: 5,
          comment: 'Great place!',
          status: 'approved',
          createdAt: new Date('2024-01-01'),
          listingSlug: 'test-listing',
          user: null, // No user info
        },
      ];

      const mockCollection = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(mockReviews),
      };

      mockGetCollection.mockResolvedValueOnce(mockCollection as unknown as Collection);

      const result = await getListingReviews('test-listing');

      expect(result[0].user.name).toBe('Anonymous');
    });

    it('should handle fetch errors gracefully', async () => {
      mockGetCollection.mockRejectedValueOnce(new Error('Database error'));

      const result = await getListingReviews('test-listing', 'user-1');

      expect(result).toEqual([]);
      expect(structuredLogger.error).toHaveBeenCalledWith(
        'Failed to fetch listing reviews',
        expect.any(Error),
        expect.objectContaining({ listingSlug: 'test-listing', userId: 'user-1' })
      );
    });

    it('should return empty array on database connection failure', async () => {
      mockGetCollection.mockResolvedValueOnce(null as never);

      const result = await getListingReviews('test-listing');

      expect(result).toEqual([]);
    });
  });
});
