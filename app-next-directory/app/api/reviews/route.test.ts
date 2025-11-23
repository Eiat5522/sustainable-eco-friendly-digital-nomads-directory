import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('@/lib/auth', () => ({ __esModule: true, auth: jest.fn() }));
jest.mock('@/lib/sanity/client', () => ({
  __esModule: true,
  client: {
    getDocument: jest.fn(),
    create: jest.fn(),
    fetch: jest.fn(),
  },
}));
jest.mock('@/lib/sanity/user', () => ({ __esModule: true, ensureSanityUser: jest.fn() }));
jest.mock('@/utils/db-helpers', () => ({ __esModule: true, getCollection: jest.fn() }));
jest.mock('next/cache', () => ({ __esModule: true, revalidateTag: jest.fn() }));
jest.mock('@/lib/logger', () => ({
  __esModule: true,
  structuredLogger: { apiError: jest.fn() },
  getRequestContext: jest.fn().mockReturnValue({}),
}));
jest.mock('mongodb', () => ({
  __esModule: true,
  MongoClient: class {
    connect() {
      return Promise.resolve(this);
    }
    db() {
      return {
        collection: () => ({
          find: jest.fn(),
          project: jest.fn(),
        }),
      };
    }
  },
}));

import { revalidateTag } from 'next/cache';
import { auth } from '@/lib/auth';
import { structuredLogger } from '@/lib/logger';
import { client } from '@/lib/sanity/client';
import { ensureSanityUser } from '@/lib/sanity/user';
import { GET, POST } from './route';

describe('API /api/reviews GET', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (client.fetch as jest.Mock).mockResolvedValue(null);
  });

  // Simplified mock setup
  function createMockCollection(docs: any[] = [], totalCount?: number) {
    const mockCursor = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue(docs),
    };

    return {
      find: jest.fn().mockReturnValue(mockCursor),
      countDocuments: jest.fn().mockResolvedValue(totalCount ?? docs.length),
      _mockCursor: mockCursor, // Expose for assertions
    };
  }

  it('returns reviews with pagination defaulting to page=1, limit=10 and applies DB params', async () => {
    const mockCollection = createMockCollection([
      { _id: 'r1', verified: true, helpfulCount: 2 },
      { _id: 'r2', verified: false, helpfulCount: 0 },
    ]);

    const req = new Request('http://localhost/api/reviews');
    const res = await GET(req, { collection: mockCollection } as any);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data.reviews)).toBe(true);
    expect(json.data.pagination.page).toBe(1);
    expect(json.data.pagination.limit).toBe(10);

    // Verify DB query parameters
    expect(mockCollection.find).toHaveBeenCalledWith({ status: 'approved' });
    expect(mockCollection._mockCursor.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(mockCollection._mockCursor.skip).toHaveBeenCalledWith(0);
    expect(mockCollection._mockCursor.limit).toHaveBeenCalledWith(10);
  });

  it('merges pending reviews for the requesting user when userId is supplied', async () => {
    const mockCollection = createMockCollection([{ _id: 'r1', status: 'pending', user: 'user-1' }]);
    const req = new Request(
      'http://localhost/api/reviews?listing=list-1&userId=user-1&page=2&limit=5'
    );

    await GET(req, { collection: mockCollection } as any);

    expect(mockCollection.find).toHaveBeenCalledWith({
      $or: [{ status: 'approved' }, { status: 'pending', user: 'user-1' }],
      listingSlug: 'list-1',
    });
    expect(mockCollection._mockCursor.skip).toHaveBeenCalledWith(5);
  });

  it('supports filtering by listing, rating, and verified status', async () => {
    const mockCollection = createMockCollection([{ _id: 'r1', verified: true, helpfulCount: 5 }]);
    const req = new Request('http://localhost/api/reviews?listing=slug-1&rating=5&verified=true');
    const res = await GET(req, { collection: mockCollection } as any);

    expect(res.status).toBe(200);

    expect(mockCollection.find).toHaveBeenCalledWith({
      status: 'approved',
      listingSlug: 'slug-1',
      rating: 5,
      verified: true,
    });
  });

  it('supports sorting by helpful, and sets isHelpful correctly', async () => {
    const mockCollection = createMockCollection([{ _id: 'r1', verified: true, helpfulCount: 5 }]);
    const req = new Request('http://localhost/api/reviews?listing=slug-1&sortBy=helpful');
    const res = await GET(req, { collection: mockCollection } as any);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.reviews[0]).toHaveProperty('isHelpful', true);

    expect(mockCollection.find).toHaveBeenCalledWith({ status: 'approved', listingSlug: 'slug-1' });
    expect(mockCollection._mockCursor.sort).toHaveBeenCalledWith({ helpfulCount: -1 });
  });

  it('sets isHelpful false when helpfulCount is 0 or missing', async () => {
    const mockCollection = createMockCollection([
      { _id: 'r1', verified: true, helpfulCount: 0 },
      { _id: 'r2', verified: true },
    ]);
    const req = new Request('http://localhost/api/reviews');
    const res = await GET(req, { collection: mockCollection } as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.reviews[0].isHelpful).toBe(false);
    expect(json.data.reviews[1].isHelpful).toBe(false);
  });

  it('returns empty list and correct pagination when no results', async () => {
    const mockCollection = createMockCollection([], 0);
    const req = new Request('http://localhost/api/reviews?page=2&limit=10');
    const res = await GET(req, { collection: mockCollection } as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.reviews).toEqual([]);
    expect(json.data.pagination).toMatchObject({
      page: 2,
      limit: 10,
      total: 0,
      pages: 0,
      hasNext: false,
      hasPrev: true,
    });
  });

  it('handles internal errors with 500', async () => {
    // Create a mock that throws an error
    const badCollection = {
      find: jest.fn().mockImplementation(() => {
        throw new Error('DB down');
      }),
      countDocuments: jest.fn(),
    };

    const req = new Request('http://localhost/api/reviews');
    const res = await GET(req, { collection: badCollection } as any);

    // The most important thing is that it returns a 500 status code
    expect(res.status).toBe(500);

    // Verify the mock was called (error was triggered)
    expect(badCollection.find).toHaveBeenCalled();
  });
});

describe('API /api/reviews POST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (client.fetch as jest.Mock).mockResolvedValue(null);
  });

  it('rejects unauthenticated requests', async () => {
    (auth as jest.Mock).mockResolvedValueOnce(null);

    const res = await POST(
      new Request('http://localhost/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          listingId: 'listing-1',
          rating: 4,
          comment: 'This is a sufficiently long review text.',
        }),
      })
    );

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('rejects users without review permissions', async () => {
    (auth as jest.Mock).mockResolvedValueOnce({ user: { id: 'user-1', role: 'unidentifiedUser' } });

    const res = await POST(
      new Request('http://localhost/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          listingId: 'listing-1',
          rating: 4,
          comment: 'This is a sufficiently long review text.',
        }),
      })
    );

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe('Forbidden: Insufficient permissions to create reviews');
    expect(client.create).not.toHaveBeenCalled();
  });

  it('validates incoming payload and enforces rating constraints', async () => {
    (auth as jest.Mock).mockResolvedValueOnce({ user: { id: 'user-1', role: 'user' } });

    const res = await POST(
      new Request('http://localhost/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          listingId: 'listing-1',
          rating: 6,
          comment: 'This is a sufficiently long review text.',
        }),
      })
    );

    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toBe('Rating must be a number between 1 and 5.');
    expect(client.create).not.toHaveBeenCalled();
  });

  it('validates incoming payload and enforces minimum comment length', async () => {
    (auth as jest.Mock).mockResolvedValueOnce({ user: { id: 'user-1', role: 'user' } });

    const res = await POST(
      new Request('http://localhost/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ listingId: 'listing-1', rating: 4, comment: 'Too short' }),
      })
    );

    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toBe('Comment must be at least 20 characters.');
    expect(client.create).not.toHaveBeenCalled();
  });

  it('returns conflict when a user already reviewed the listing', async () => {
    (auth as jest.Mock).mockResolvedValueOnce({ user: { id: 'user-1', role: 'user' } });
    (client.getDocument as jest.Mock).mockResolvedValueOnce({
      _id: 'listing-1',
      slug: { current: 'listing-slug' },
    });
    (ensureSanityUser as jest.Mock).mockResolvedValueOnce({ _id: 'sanity-user-1' });
    (client.fetch as jest.Mock).mockResolvedValueOnce({ _id: 'existing-review' });

    const res = await POST(
      new Request('http://localhost/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          listingId: 'listing-1',
          rating: 5,
          comment: 'This comment is definitely long enough.',
        }),
      })
    );

    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toBe('You have already reviewed this listing');
    expect(client.create).not.toHaveBeenCalled();
  });

  it('returns 422 when the request body cannot be parsed', async () => {
    (auth as jest.Mock).mockResolvedValueOnce({ user: { id: 'user-1', role: 'user' } });

    const failingRequest = {
      json: jest.fn().mockRejectedValue(new Error('boom')),
      method: 'POST',
      headers: new Headers(),
    } as unknown as Request;

    const res = await POST(failingRequest);

    expect(res.status).toBe(422);
    const payload = await res.json();
    expect(payload.error).toBe('Invalid review data');
    expect(payload.success).toBe(false);
    expect(client.create).not.toHaveBeenCalled();
  });

  it('requires valid listing and user references', async () => {
    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: 'user-1', role: 'user', email: 'user@example.com' },
    });
    (client.getDocument as jest.Mock).mockResolvedValueOnce(null);
    (ensureSanityUser as jest.Mock).mockResolvedValueOnce({ _id: 'sanity-user-1' });

    const res = await POST(
      new Request('http://localhost/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          listingId: 'missing',
          rating: 3,
          comment: 'This is a sufficiently long review text.',
        }),
      })
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Invalid reference(s)');
    expect(client.create).not.toHaveBeenCalled();
  });

  it('creates a pending review, trims comment, and revalidates the listing page', async () => {
    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: 'user-1', role: 'user', name: 'Reviewer', email: 'user@example.com' },
    });
    (client.getDocument as jest.Mock).mockResolvedValueOnce({
      _id: 'listing-1',
      slug: { current: 'listing-slug' },
    });
    (ensureSanityUser as jest.Mock).mockResolvedValueOnce({ _id: 'sanity-user-1' });
    (client.create as jest.Mock).mockResolvedValueOnce({
      _id: 'review-1',
      approved: false,
      createdAt: '2024-01-01T00:00:00.000Z',
    });

    const res = await POST(
      new Request('http://localhost/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          listingId: 'listing-1',
          rating: 5,
          comment: '   Fantastic eco stay with brilliant amenities.   ',
        }),
      })
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toMatchObject({
      id: 'review-1',
      rating: 5,
      comment: 'Fantastic eco stay with brilliant amenities.',
      approved: false,
    });
    expect(client.create).toHaveBeenCalledWith(
      expect.objectContaining({
        _type: 'review',
        rating: 5,
        comment: 'Fantastic eco stay with brilliant amenities.',
        approved: false,
        listing: { _type: 'reference', _ref: 'listing-1' },
        user: { _type: 'reference', _ref: 'sanity-user-1' },
      })
    );
    if (jest.isMockFunction(revalidateTag)) {
      expect(revalidateTag).toHaveBeenCalledWith('listing:listing-slug');
    }
  });

  it('includes optional eco and nomad ratings when supplied', async () => {
    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: 'user-2', role: 'user', name: 'Eco Fan', email: 'eco@example.com' },
    });
    (client.getDocument as jest.Mock).mockResolvedValueOnce({
      _id: 'listing-eco',
      slug: { current: 'eco-slug' },
    });
    (ensureSanityUser as jest.Mock).mockResolvedValueOnce({ _id: 'sanity-user-eco' });
    (client.create as jest.Mock).mockResolvedValueOnce({ _id: 'review-eco', approved: false });

    const res = await POST(
      new Request('http://localhost/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          listingId: 'listing-eco',
          rating: 4,
          comment: 'Plenty of plants and thoughtful amenities make this a joy.',
          ecoRating: 5,
          nomadRating: 4,
        }),
      })
    );

    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.data).toMatchObject({ ecoRating: 5, nomadRating: 4 });
    expect(client.create).toHaveBeenCalledWith(
      expect.objectContaining({ ecoRating: 5, nomadRating: 4 })
    );
  });

  it('logs and returns 500 when creation fails unexpectedly', async () => {
    (auth as jest.Mock).mockResolvedValueOnce({ user: { id: 'user-1', role: 'user' } });
    (client.getDocument as jest.Mock).mockResolvedValueOnce({ _id: 'listing-1' });
    (ensureSanityUser as jest.Mock).mockResolvedValueOnce({ _id: 'sanity-user-1' });
    (client.create as jest.Mock).mockRejectedValueOnce(new Error('Sanity failure'));

    const res = await POST(
      new Request('http://localhost/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          listingId: 'listing-1',
          rating: 4,
          comment: 'This is a sufficiently long review text.',
        }),
      })
    );

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Failed to submit review');
    if (jest.isMockFunction(structuredLogger.apiError)) {
      expect(structuredLogger.apiError).toHaveBeenCalled();
    }
  });
});
