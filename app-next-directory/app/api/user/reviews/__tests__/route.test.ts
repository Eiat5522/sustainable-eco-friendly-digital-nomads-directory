import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock external dependencies instead of exporting mutable testControl from production code.
jest.mock('@/lib/auth', () => ({ auth: jest.fn() }));
jest.mock('@/utils/db-helpers', () => ({ getCollection: jest.fn() }));

import {
  GET,
  normaliseSlug,
  normaliseListing,
  normaliseReview,
  isDeletedStatus,
} from '../route';

import { auth } from '@/lib/auth';
import { getCollection } from '@/utils/db-helpers';

const authMock = auth as unknown as jest.Mock;
const getCollectionMock = getCollection as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  authMock.mockReset();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('helper utilities', () => {
  describe('normaliseSlug', () => {
    it('returns trimmed strings as-is', () => {
      expect(normaliseSlug('  eco-hub  ')).toBe('eco-hub');
    });

    it('extracts slugs from Sanity slug objects', () => {
      expect(normaliseSlug({ current: ' eco-hub ' })).toBe('eco-hub');
    });

    it('returns null for invalid values', () => {
      expect(normaliseSlug('')).toBeNull();
      expect(normaliseSlug(null)).toBeNull();
      expect(normaliseSlug({})).toBeNull();
    });
  });

  describe('normaliseListing', () => {
    it('returns null when the slug cannot be derived', () => {
      expect(normaliseListing({ slug: undefined, name: 'Test' })).toBeNull();
    });

    it('provides a default name when one is missing', () => {
      expect(normaliseListing({ slug: 'eco-hub' })?.name).toBe('Untitled listing');
    });

    it('returns a trimmed name when provided', () => {
      const listing = normaliseListing({ slug: 'eco-hub', name: '  Eco Hub  ' });
      expect(listing).toEqual({ slug: 'eco-hub', name: 'Eco Hub' });
    });
  });

  describe('normaliseReview', () => {
    it('returns null for invalid ratings', () => {
      expect(normaliseReview({ rating: 'not-a-number' })).toBeNull();
      expect(normaliseReview({ rating: 0 })).toBeNull();
    });

    it('normalises review fields and falls back to anonymous data', () => {
      const review = normaliseReview({
        rating: '5',
        comment: 123,
        createdAt: '2024-02-20T10:00:00Z',
        user: { name: ' Nomad ', image: ' avatar.png ' },
      });

      expect(review).toMatchObject({
        rating: 5,
        comment: '',
        createdAt: '2024-02-20T10:00:00.000Z',
        reviewerName: 'Nomad',
        reviewerImage: 'avatar.png',
      });
      expect(review?.id).toEqual(expect.any(String));
    });

    it('prefers explicit userName over nested user.name', () => {
      const review = normaliseReview({
        rating: 4,
        comment: 'Great stay',
        userName: ' Direct Name ',
        user: { name: 'Nested Name' },
      });

      expect(review?.reviewerName).toBe('Direct Name');
    });

    it('generates a UUID when no identifier is present', () => {
      const first = normaliseReview({ rating: 4, comment: 'Nice place' });
      const second = normaliseReview({ rating: 4, comment: 'Nice place' });

      expect(first?.id).toMatch(/[0-9a-f-]{36}/i);
      expect(second?.id).toMatch(/[0-9a-f-]{36}/i);
      expect(first?.id).not.toEqual(second?.id);
    });
  });

  describe('isDeletedStatus', () => {
    it('detects deleted, removed, and archived statuses', () => {
      expect(isDeletedStatus('deleted')).toBe(true);
      expect(isDeletedStatus('Removed')).toBe(true);
      expect(isDeletedStatus('ARCHIVED')).toBe(true);
    });

    it('ignores other statuses', () => {
      expect(isDeletedStatus('published')).toBe(false);
      expect(isDeletedStatus(null)).toBe(false);
    });
  });
});

describe('/api/user/reviews', () => {
  it('returns 401 when not authenticated', async () => {
    authMock.mockResolvedValue(null);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Authentication required');
  });

  it('returns empty array for non-venue owners', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1', role: 'user' } });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.listings).toEqual([]);
    expect(getCollectionMock).not.toHaveBeenCalled();
  });

  it('returns listings with reviews for venue owner', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1', role: 'venueOwner' } });

    const mockListings = [
      { slug: 'test-listing', name: 'Test Listing', status: 'published', ownerId: 'user-1' },
    ];

    const mockReviews = [
      {
        _id: 'review-1',
        listingSlug: 'test-listing',
        rating: 5,
        comment: 'Great!',
        createdAt: new Date('2024-01-01'),
        userName: 'John',
        status: 'approved',
      },
    ];

    const listingsCursor = {
      project: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockListings),
      }),
    };

    const reviewsCursor = {
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue(mockReviews),
        }),
      }),
    };

    getCollectionMock
      .mockResolvedValueOnce({ find: jest.fn().mockReturnValue(listingsCursor) })
      .mockResolvedValueOnce({ find: jest.fn().mockReturnValue(reviewsCursor) });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.listings).toHaveLength(1);
    expect(json.listings[0].reviews).toHaveLength(1);
    expect(json.listings[0].reviews[0].rating).toBe(5);
  });

  it('filters out deleted listings and invalid reviews', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1', role: 'venueOwner' } });

    const listingsCursor = {
      project: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          { slug: 'active', name: 'Active', status: 'published', ownerId: 'user-1' },
          { slug: 'deleted', name: 'Deleted Listing', status: 'deleted', ownerId: 'user-1' },
        ]),
      }),
    };

    const reviewsCursor = {
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([
            { rating: 0, comment: 'bad data' },
            { rating: 4, comment: 'Solid stay', createdAt: new Date('2024-02-01') },
          ]),
        }),
      }),
    };

    getCollectionMock
      .mockResolvedValueOnce({ find: jest.fn().mockReturnValue(listingsCursor) })
      .mockResolvedValueOnce({ find: jest.fn().mockReturnValue(reviewsCursor) });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.listings).toHaveLength(1);
    expect(json.listings[0].slug).toBe('active');
    expect(json.listings[0].reviews).toHaveLength(1);
    expect(json.listings[0].reviews[0].rating).toBe(4);
  });

  it('handles database errors', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1', role: 'venueOwner' } });

    getCollectionMock.mockRejectedValue(new Error('Database error'));

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to load reviews');

    consoleErrorSpy.mockRestore();
  });
});
