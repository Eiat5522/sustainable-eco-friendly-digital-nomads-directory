import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

import { GET, testControl } from '../route';

const authMock = jest.fn();
const getCollectionMock = jest.fn();

beforeEach(() => {
  testControl.authOverride = undefined;
  testControl.getCollectionOverride = undefined;
  authMock.mockReset();
  getCollectionMock.mockReset();
});

afterEach(() => {
  testControl.authOverride = undefined;
  testControl.getCollectionOverride = undefined;
});

describe('/api/user/reviews', () => {
  it('returns 401 when not authenticated', async () => {
    testControl.authOverride = authMock.mockResolvedValue(null);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Authentication required');
  });

  it('returns empty array for non-venue owners', async () => {
    testControl.authOverride = authMock.mockResolvedValue({
      user: { id: 'user-1', role: 'user' },
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.listings).toEqual([]);
    expect(getCollectionMock).not.toHaveBeenCalled();
  });

  it('returns listings with reviews for venue owner', async () => {
    testControl.authOverride = authMock.mockResolvedValue({
      user: { id: 'user-1', role: 'venueOwner' },
    });

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
      .mockResolvedValueOnce({
        find: jest.fn().mockReturnValue(listingsCursor),
      })
      .mockResolvedValueOnce({
        find: jest.fn().mockReturnValue(reviewsCursor),
      });

    testControl.getCollectionOverride = getCollectionMock;

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.listings).toHaveLength(1);
    expect(json.listings[0].reviews).toHaveLength(1);
    expect(json.listings[0].reviews[0].rating).toBe(5);
  });

  it('handles database errors', async () => {
    testControl.authOverride = authMock.mockResolvedValue({
      user: { id: 'user-1', role: 'venueOwner' },
    });

    getCollectionMock.mockRejectedValue(new Error('Database error'));
    testControl.getCollectionOverride = getCollectionMock;

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to load reviews');
  });
});
