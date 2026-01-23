/**
 * Unit tests for profile.dal.ts
 * Tests the Data Access Layer for user profile data
 */

import { jest } from '@jest/globals';
import { getOwnerReviewsForProfile, getUserDashboardForProfile } from '../profile.dal';

// Mock dependencies
jest.mock('@/lib/dashboard/user-dashboard', () => ({
  getUserDashboardData: jest.fn(),
}));

jest.mock('@/utils/db-helpers', () => ({
  getCollection: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  structuredLogger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('next/cache', () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
}));

// Import mocked modules
import { getUserDashboardData } from '@/lib/dashboard/user-dashboard';
import { structuredLogger } from '@/lib/logger';
import { getCollection } from '@/utils/db-helpers';

const mockGetUserDashboardData = getUserDashboardData as jest.MockedFunction<
  typeof getUserDashboardData
>;
const mockGetCollection = getCollection as jest.MockedFunction<typeof getCollection>;

describe('profile.dal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserDashboardForProfile', () => {
    it('should fetch user dashboard data successfully', async () => {
      const mockUser = {
        id: 'user-1',
        role: 'user' as UserRole,
        name: 'Test User',
        email: 'test@example.com',
      };

      const mockDashboard = {
        totalListings: 5,
        totalReviews: 10,
        averageRating: 4.5,
      };

      mockGetUserDashboardData.mockResolvedValue(mockDashboard as any);

      const result = await getUserDashboardForProfile(mockUser, 3);

      expect(result).toEqual(mockDashboard);
      expect(mockGetUserDashboardData).toHaveBeenCalledWith(mockUser, { months: 3 });
    });

    it('should use default months parameter', async () => {
      const mockUser = {
        id: 'user-1',
        role: 'user' as UserRole,
      };

      mockGetUserDashboardData.mockResolvedValue({} as any);

      await getUserDashboardForProfile(mockUser);

      expect(mockGetUserDashboardData).toHaveBeenCalledWith(mockUser, { months: 3 });
    });

    it('should throw error when dashboard data fails', async () => {
      const mockUser = {
        id: 'user-1',
        role: 'user' as UserRole,
      };

      const error = new Error('Database error');
      mockGetUserDashboardData.mockRejectedValue(error);

      await expect(getUserDashboardForProfile(mockUser)).rejects.toThrow('Database error');

      expect(structuredLogger.error).toHaveBeenCalledWith(
        'Failed to load user dashboard',
        error,
        expect.objectContaining({
          component: 'profile.dal',
          userId: 'user-1',
        })
      );
    });
  });

  describe('getOwnerReviewsForProfile', () => {
    const createMockCollection = () => ({
      aggregate: jest.fn().mockReturnValue({
        toArray: jest.fn(),
      }),
    });

    it('should return empty array for non-venue owner', async () => {
      const result = await getOwnerReviewsForProfile('user-1', 'user');

      expect(result).toEqual([]);
      expect(mockGetCollection).not.toHaveBeenCalled();
    });

    it('should fetch owner reviews for venue owner', async () => {
      const mockCollection = createMockCollection();
      mockCollection.aggregate().toArray.mockResolvedValue([
        {
          slug: 'listing-1',
          name: 'Test Listing',
          reviews: [
            {
              _id: 'review-1',
              rating: 5,
              comment: 'Great place!',
              createdAt: new Date('2024-01-01'),
              userName: 'John Doe',
            },
          ],
        },
      ]);

      mockGetCollection.mockResolvedValue(mockCollection as any);

      const result = await getOwnerReviewsForProfile('owner-1', 'venueOwner');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        slug: 'listing-1',
        name: 'Test Listing',
        reviews: [
          {
            id: 'review-1',
            rating: 5,
            comment: 'Great place!',
            createdAt: expect.any(String),
            reviewerName: 'John Doe',
            reviewerImage: undefined,
          },
        ],
      });
    });

    it('should handle string slug', async () => {
      const mockCollection = createMockCollection();
      mockCollection.aggregate().toArray.mockResolvedValue([
        {
          slug: 'listing-slug',
          name: 'Test Listing',
          reviews: [],
        },
      ]);

      mockGetCollection.mockResolvedValue(mockCollection as any);

      const result = await getOwnerReviewsForProfile('owner-1', 'venueOwner');

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('listing-slug');
    });

    it('should handle object slug with current property', async () => {
      const mockCollection = createMockCollection();
      mockCollection.aggregate().toArray.mockResolvedValue([
        {
          slug: { current: 'listing-slug' },
          name: 'Test Listing',
          reviews: [],
        },
      ]);

      mockGetCollection.mockResolvedValue(mockCollection as any);

      const result = await getOwnerReviewsForProfile('owner-1', 'venueOwner');

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('listing-slug');
    });

    it('should filter out listings with invalid slugs', async () => {
      const mockCollection = createMockCollection();
      mockCollection.aggregate().toArray.mockResolvedValue([
        {
          slug: '',
          name: 'Invalid Slug',
          reviews: [],
        },
        {
          slug: 'valid-slug',
          name: 'Valid Listing',
          reviews: [],
        },
        {
          slug: null,
          name: 'Null Slug',
          reviews: [],
        },
      ]);

      mockGetCollection.mockResolvedValue(mockCollection as any);

      const result = await getOwnerReviewsForProfile('owner-1', 'venueOwner');

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('valid-slug');
    });

    it('should use default name for listings without name', async () => {
      const mockCollection = createMockCollection();
      mockCollection.aggregate().toArray.mockResolvedValue([
        {
          slug: 'listing-1',
          name: '',
          reviews: [],
        },
      ]);

      mockGetCollection.mockResolvedValue(mockCollection as any);

      const result = await getOwnerReviewsForProfile('owner-1', 'venueOwner');

      expect(result[0].name).toBe('Untitled listing');
    });

    it('should filter out reviews with invalid ratings', async () => {
      const mockCollection = createMockCollection();
      mockCollection.aggregate().toArray.mockResolvedValue([
        {
          slug: 'listing-1',
          name: 'Test Listing',
          reviews: [
            {
              _id: 'review-1',
              rating: 5,
              createdAt: new Date('2024-01-01'),
            },
            {
              _id: 'review-2',
              rating: 0,
              createdAt: new Date('2024-01-02'),
            },
            {
              _id: 'review-3',
              rating: NaN,
              createdAt: new Date('2024-01-03'),
            },
            {
              _id: 'review-4',
              rating: -1,
              createdAt: new Date('2024-01-04'),
            },
          ],
        },
      ]);

      mockGetCollection.mockResolvedValue(mockCollection as any);

      const result = await getOwnerReviewsForProfile('owner-1', 'venueOwner');

      expect(result[0].reviews).toHaveLength(1);
      expect(result[0].reviews[0].rating).toBe(5);
    });

    it('should use reviewer name from user object when userName is missing', async () => {
      const mockCollection = createMockCollection();
      mockCollection.aggregate().toArray.mockResolvedValue([
        {
          slug: 'listing-1',
          name: 'Test Listing',
          reviews: [
            {
              _id: 'review-1',
              rating: 5,
              createdAt: new Date('2024-01-01'),
              user: { name: 'Jane Doe' },
            },
          ],
        },
      ]);

      mockGetCollection.mockResolvedValue(mockCollection as any);

      const result = await getOwnerReviewsForProfile('owner-1', 'venueOwner');

      expect(result[0].reviews[0].reviewerName).toBe('Jane Doe');
    });

    it('should use default reviewer name when both userName and user.name are missing', async () => {
      const mockCollection = createMockCollection();
      mockCollection.aggregate().toArray.mockResolvedValue([
        {
          slug: 'listing-1',
          name: 'Test Listing',
          reviews: [
            {
              _id: 'review-1',
              rating: 5,
              createdAt: new Date('2024-01-01'),
            },
          ],
        },
      ]);

      mockGetCollection.mockResolvedValue(mockCollection as any);

      const result = await getOwnerReviewsForProfile('owner-1', 'venueOwner');

      expect(result[0].reviews[0].reviewerName).toBe('Anonymous nomad');
    });

    it('should use reviewer image from userImage or user.image', async () => {
      const mockCollection = createMockCollection();
      mockCollection.aggregate().toArray.mockResolvedValue([
        {
          slug: 'listing-1',
          name: 'Test Listing',
          reviews: [
            {
              _id: 'review-1',
              rating: 5,
              createdAt: new Date('2024-01-01'),
              userImage: 'https://example.com/image1.jpg',
            },
            {
              _id: 'review-2',
              rating: 4,
              createdAt: new Date('2024-01-02'),
              user: { image: 'https://example.com/image2.jpg' },
            },
          ],
        },
      ]);

      mockGetCollection.mockResolvedValue(mockCollection as any);

      const result = await getOwnerReviewsForProfile('owner-1', 'venueOwner');

      expect(result[0].reviews[0].reviewerImage).toBe('https://example.com/image1.jpg');
      expect(result[0].reviews[1].reviewerImage).toBe('https://example.com/image2.jpg');
    });

    it('should handle different createdAt formats', async () => {
      const mockCollection = createMockCollection();
      mockCollection.aggregate().toArray.mockResolvedValue([
        {
          slug: 'listing-1',
          name: 'Test Listing',
          reviews: [
            {
              _id: 'review-1',
              rating: 5,
              createdAt: new Date('2024-01-01'),
            },
            {
              _id: 'review-2',
              rating: 4,
              createdAt: '2024-01-02T00:00:00.000Z',
            },
            {
              _id: 'review-3',
              rating: 3,
              createdAt: null,
            },
          ],
        },
      ]);

      mockGetCollection.mockResolvedValue(mockCollection as any);

      const result = await getOwnerReviewsForProfile('owner-1', 'venueOwner');

      expect(result[0].reviews).toHaveLength(3);
      result[0].reviews.forEach(review => {
        expect(review.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      });
    });

    it('should handle ObjectId _id format', async () => {
      const mockCollection = createMockCollection();
      mockCollection.aggregate().toArray.mockResolvedValue([
        {
          slug: 'listing-1',
          name: 'Test Listing',
          reviews: [
            {
              _id: { toString: () => 'object-id-123' },
              rating: 5,
              createdAt: new Date('2024-01-01'),
            },
          ],
        },
      ]);

      mockGetCollection.mockResolvedValue(mockCollection as any);

      const result = await getOwnerReviewsForProfile('owner-1', 'venueOwner');

      expect(result[0].reviews[0].id).toBe('object-id-123');
    });

    it('should filter out reviews with missing _id', async () => {
      const mockCollection = createMockCollection();
      mockCollection.aggregate().toArray.mockResolvedValue([
        {
          slug: 'listing-1',
          name: 'Test Listing',
          reviews: [
            {
              _id: 'review-1',
              rating: 5,
              createdAt: new Date('2024-01-01'),
            },
            {
              rating: 4,
              createdAt: new Date('2024-01-02'),
            },
          ],
        },
      ]);

      mockGetCollection.mockResolvedValue(mockCollection as any);

      const result = await getOwnerReviewsForProfile('owner-1', 'venueOwner');

      expect(result[0].reviews).toHaveLength(1);
    });

    it('should handle empty reviews array', async () => {
      const mockCollection = createMockCollection();
      mockCollection.aggregate().toArray.mockResolvedValue([
        {
          slug: 'listing-1',
          name: 'Test Listing',
          reviews: [],
        },
      ]);

      mockGetCollection.mockResolvedValue(mockCollection as any);

      const result = await getOwnerReviewsForProfile('owner-1', 'venueOwner');

      expect(result[0].reviews).toEqual([]);
    });

    it('should handle collection errors gracefully', async () => {
      const error = new Error('Collection error');
      mockGetCollection.mockRejectedValue(error);

      await expect(getOwnerReviewsForProfile('owner-1', 'venueOwner')).rejects.toThrow(
        'Collection error'
      );

      expect(structuredLogger.error).toHaveBeenCalledWith(
        'Failed to load owner reviews',
        error,
        expect.objectContaining({
          component: 'profile.dal',
          userId: 'owner-1',
        })
      );
    });

    it('should trim whitespace from slugs and names', async () => {
      const mockCollection = createMockCollection();
      mockCollection.aggregate().toArray.mockResolvedValue([
        {
          slug: '  listing-slug  ',
          name: '  Test Listing  ',
          reviews: [],
        },
      ]);

      mockGetCollection.mockResolvedValue(mockCollection as any);

      const result = await getOwnerReviewsForProfile('owner-1', 'venueOwner');

      expect(result[0].slug).toBe('listing-slug');
      expect(result[0].name).toBe('Test Listing');
    });

    it('should trim whitespace from reviewer names', async () => {
      const mockCollection = createMockCollection();
      mockCollection.aggregate().toArray.mockResolvedValue([
        {
          slug: 'listing-1',
          name: 'Test Listing',
          reviews: [
            {
              _id: 'review-1',
              rating: 5,
              createdAt: new Date('2024-01-01'),
              userName: '  John Doe  ',
            },
          ],
        },
      ]);

      mockGetCollection.mockResolvedValue(mockCollection as any);

      const result = await getOwnerReviewsForProfile('owner-1', 'venueOwner');

      expect(result[0].reviews[0].reviewerName).toBe('John Doe');
    });
  });
});
