jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/utils/db-helpers', () => ({
  getCollection: jest.fn(),
}));

import {
  GET,
  isDeletedStatus,
  normaliseListing,
  normaliseReview,
  normaliseSlug,
} from '../../../../../app/api/user/reviews/route';
import { auth } from '@/lib/auth';
import { getCollection } from '@/utils/db-helpers';

type MockedFunction<T extends (...args: any[]) => any> = jest.MockedFunction<T>;

const mockAuth = auth as MockedFunction<typeof auth>;
const mockGetCollection = getCollection as MockedFunction<typeof getCollection>;

describe('normaliseSlug', () => {
  it('handles primitive and object-based slugs', () => {
    expect(normaliseSlug(' eco-space ')).toBe('eco-space');
    expect(normaliseSlug({ current: '  green-escape  ' })).toBe('green-escape');
  });

  it('returns null when a slug cannot be resolved', () => {
    expect(normaliseSlug('')).toBeNull();
    expect(normaliseSlug(undefined)).toBeNull();
    expect(normaliseSlug({})).toBeNull();
  });
});

describe('normaliseListing', () => {
  it('returns a normalised listing when the slug is valid', () => {
    expect(normaliseListing({ slug: ' eco-hub ', name: '  Eco Hub  ' })).toEqual({
      slug: 'eco-hub',
      name: 'Eco Hub',
    });
  });

  it('falls back to a placeholder name when necessary', () => {
    expect(normaliseListing({ slug: { current: 'forest-retreat' }, name: '' })).toEqual({
      slug: 'forest-retreat',
      name: 'Untitled listing',
    });
  });

  it('returns null when no slug can be produced', () => {
    expect(normaliseListing({ slug: undefined, name: 'Test' })).toBeNull();
  });
});

describe('normaliseReview', () => {
  it('builds a consistent review payload from various shapes', () => {
    const doc = {
      _id: { toString: () => 'rev-123' },
      rating: '4.5',
      comment: undefined,
      createdAt: '2024-01-02T00:00:00.000Z',
      userName: '  Taylor  ',
      userImage: '',
      user: {
        name: 'Jordan',
        image: 'https://example.com/jordan.png',
      },
    };

    expect(normaliseReview(doc)).toEqual({
      id: 'rev-123',
      rating: 4.5,
      comment: '',
      createdAt: '2024-01-02T00:00:00.000Z',
      reviewerName: 'Taylor',
      reviewerImage: 'https://example.com/jordan.png',
    });
  });

  it('returns null for reviews without a positive numeric rating', () => {
    expect(normaliseReview({ rating: 0 })).toBeNull();
    expect(normaliseReview({ rating: 'not-a-number' })).toBeNull();
  });
});

describe('isDeletedStatus', () => {
  it('detects any archived-like status', () => {
    expect(isDeletedStatus('deleted')).toBe(true);
    expect(isDeletedStatus('Archived')).toBe(true);
    expect(isDeletedStatus('REMOVED')).toBe(true);
  });

  it('ignores other statuses', () => {
    expect(isDeletedStatus('published')).toBe(false);
    expect(isDeletedStatus('draft')).toBe(false);
    expect(isDeletedStatus(undefined)).toBe(false);
  });
});

describe('GET /api/user/reviews', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires an authenticated user', async () => {
    mockAuth.mockResolvedValueOnce({ user: null } as any);

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Authentication required' });
    expect(mockGetCollection).not.toHaveBeenCalled();
  });

  it('returns an empty payload for non-owner accounts', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user-1', role: 'member' } } as any);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ listings: [] });
    expect(mockGetCollection).not.toHaveBeenCalled();
  });

  it('aggregates listings and reviews for venue owners', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'owner-1', role: 'venueOwner' } } as any);

    const listingsToArray = jest.fn().mockResolvedValue([
      { slug: 'eco-hub', name: 'Eco Hub', status: 'published' },
      { slug: { current: 'archived-hut' }, name: 'Archived Hut', status: 'deleted' },
      { slug: { current: 'mystery' }, name: '   ', status: 'published' },
      { slug: null, name: 'No slug', status: 'published' },
    ]);

    const listingsCollection = {
      find: jest.fn().mockReturnValue({
        project: jest.fn().mockReturnValue({
          toArray: listingsToArray,
        }),
      }),
    };

    const reviewsBySlug: Record<string, any[]> = {
      'eco-hub': [
        {
          _id: 'review-1',
          rating: 4.2,
          comment: 'Wonderful stay',
          createdAt: new Date('2023-03-01T00:00:00.000Z'),
          userName: 'Avery',
          userImage: '',
        },
        {
          _id: { toString: () => 'review-2' },
          rating: '5',
          comment: null,
          createdAt: '2023-03-05T00:00:00.000Z',
          user: { name: 'Jamie', image: 'https://example.com/jamie.png' },
        },
        {
          _id: 'review-3',
          rating: 'invalid',
          comment: 'Should be filtered out',
          createdAt: '2023-03-06T00:00:00.000Z',
          userName: 'Invalid',
        },
      ],
      mystery: [],
    };

    const reviewsCollection = {
      find: jest.fn().mockImplementation(({ listingSlug }) => ({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue(reviewsBySlug[listingSlug] ?? []),
          }),
        }),
      })),
    };

    mockGetCollection
      .mockResolvedValueOnce(listingsCollection as any)
      .mockResolvedValueOnce(reviewsCollection as any);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mockGetCollection).toHaveBeenNthCalledWith(1, 'listings');
    expect(mockGetCollection).toHaveBeenNthCalledWith(2, 'reviews');
    expect(listingsCollection.find).toHaveBeenCalledWith({ ownerId: 'owner-1' });
    expect(reviewsCollection.find).toHaveBeenCalledWith({ listingSlug: 'eco-hub', status: 'approved' });
    expect(reviewsCollection.find).toHaveBeenCalledWith({ listingSlug: 'mystery', status: 'approved' });

    expect(payload).toEqual({
      listings: [
        {
          slug: 'eco-hub',
          name: 'Eco Hub',
          reviews: [
            {
              id: 'review-1',
              rating: 4.2,
              comment: 'Wonderful stay',
              createdAt: '2023-03-01T00:00:00.000Z',
              reviewerName: 'Avery',
              reviewerImage: undefined,
            },
            {
              id: 'review-2',
              rating: 5,
              comment: '',
              createdAt: '2023-03-05T00:00:00.000Z',
              reviewerName: 'Jamie',
              reviewerImage: 'https://example.com/jamie.png',
            },
          ],
        },
        {
          slug: 'mystery',
          name: 'Untitled listing',
          reviews: [],
        },
      ],
    });
  });
});
