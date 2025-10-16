import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GET } from '../route';
import { auth } from '@/lib/auth';
import { getCollection } from '@/utils/db-helpers';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/utils/db-helpers', () => ({
  getCollection: jest.fn(),
}));

describe('/api/user/reviews', () => {
  let mockedAuth: jest.Mock;
  let mockedGetCollection: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAuth = auth as jest.Mock;
    mockedGetCollection = getCollection as jest.Mock;
  });

  it('returns 401 when not authenticated', async () => {
    mockedAuth.mockResolvedValue(null);
    
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Authentication required');
  });

  it('returns empty array for non-venue owners', async () => {
    mockedAuth.mockResolvedValue({
      user: { id: 'user-1', role: 'user' },
    });
    
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.listings).toEqual([]);
    expect(mockedGetCollection).not.toHaveBeenCalled();
  });

  it('returns listings with reviews for venue owner', async () => {
    mockedAuth.mockResolvedValue({
      user: { id: 'user-1', role: 'venueOwner' },
    });
    
    const mockListings = [
      { slug: 'test-listing', name: 'Test Listing', status: 'published' },
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
    
    const mockListingsCollection = {
      find: jest.fn().mockReturnValue({
        project: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue(mockListings),
        }),
      }),
    };
    
    const mockReviewsCollection = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue(mockReviews),
          }),
        }),
      }),
    };
    
    mockedGetCollection
      .mockResolvedValueOnce(mockListingsCollection)
      .mockResolvedValueOnce(mockReviewsCollection);
    
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.listings).toHaveLength(1);
    expect(json.listings[0].reviews).toHaveLength(1);
    expect(json.listings[0].reviews[0].rating).toBe(5);
  });

  it('handles database errors', async () => {
    mockedAuth.mockResolvedValue({
      user: { id: 'user-1', role: 'venueOwner' },
    });
    
    mockedGetCollection.mockRejectedValue(new Error('Database error'));
    
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to load reviews');
  });
});
