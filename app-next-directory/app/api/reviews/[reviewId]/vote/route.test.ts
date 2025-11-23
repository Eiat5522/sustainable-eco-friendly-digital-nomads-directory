import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ObjectId } from 'mongodb';

jest.mock('@/utils/db-helpers', () => ({ __esModule: true, getCollection: jest.fn() }));
jest.mock('@/utils/api-response', () => ({
  __esModule: true,
  ApiResponseHandler: {
    error: jest.fn(
      (message: string, status: number, errors?: unknown) =>
        new Response(JSON.stringify({ error: message, ...(errors && { errors }) }), { status })
    ),
    notFound: jest.fn(
      (resource: string) =>
        new Response(JSON.stringify({ error: `${resource} not found` }), { status: 404 })
    ),
    success: jest.fn(
      (data: unknown, message?: string) =>
        new Response(JSON.stringify({ success: true, data, ...(message && { message }) }), {
          status: 200,
        })
    ),
  },
}));

const dbHelpersMock = jest.requireMock('@/utils/db-helpers') as { getCollection: jest.Mock };
const mockGetCollection = dbHelpersMock.getCollection;

let POST: typeof import('./route').POST;
let GET: typeof import('./route').GET;

describe('API /api/reviews/[reviewId]/vote', () => {
  beforeAll(async () => {
    ({ POST, GET } = await import('./route'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    function createMockReviewsCollection(review: any = null) {
      return {
        findOne: jest.fn().mockImplementation((filter: any) => {
          // If filter includes status: 'approved' and review doesn't have that status, return null
          if (filter?.status === 'approved' && review?.status !== 'approved') {
            return Promise.resolve(null);
          }
          return Promise.resolve(review);
        }),
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      };
    }

    function createMockVotesCollection(existingVote: any = null) {
      return {
        findOne: jest.fn().mockResolvedValue(existingVote),
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
        insertOne: jest.fn().mockResolvedValue({ insertedId: new ObjectId() }),
      };
    }

    it('rejects invalid review ID', async () => {
      const req = new Request('http://localhost/api/reviews/invalid-id/vote', {
        method: 'POST',
        body: JSON.stringify({ helpful: true }),
      });

      const res = await POST(req, { params: Promise.resolve({ reviewId: 'invalid-id' }) });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid review ID');
    });

    it('validates vote data schema', async () => {
      const validId = new ObjectId().toString();
      const req = new Request(`http://localhost/api/reviews/${validId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ helpful: 'not-boolean' }),
      });

      const res = await POST(req, { params: Promise.resolve({ reviewId: validId }) });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid vote data');
    });

    it('returns 404 when review does not exist', async () => {
      const validId = new ObjectId().toString();
      const mockReviews = createMockReviewsCollection(null);
      const mockVotes = createMockVotesCollection();

      mockGetCollection.mockResolvedValueOnce(mockReviews).mockResolvedValueOnce(mockVotes);

      const req = new Request(`http://localhost/api/reviews/${validId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ helpful: true }),
      });

      const res = await POST(req, { params: Promise.resolve({ reviewId: validId }) });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe('Review not found');
      expect(mockReviews.findOne).toHaveBeenCalledWith({
        _id: expect.any(ObjectId),
        status: 'approved',
      });
    });

    it('returns 404 when review is not approved', async () => {
      const validId = new ObjectId().toString();
      const mockReviews = createMockReviewsCollection({
        _id: new ObjectId(validId),
        status: 'pending',
      });
      const mockVotes = createMockVotesCollection();

      mockGetCollection.mockResolvedValueOnce(mockReviews).mockResolvedValueOnce(mockVotes);

      const req = new Request(`http://localhost/api/reviews/${validId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ helpful: true }),
      });

      const res = await POST(req, { params: Promise.resolve({ reviewId: validId }) });

      expect(res.status).toBe(404);
    });

    it('creates new vote for first-time voter', async () => {
      const validId = new ObjectId().toString();
      const mockReviews = createMockReviewsCollection({
        _id: new ObjectId(validId),
        status: 'approved',
        helpfulCount: 5,
      });
      const mockVotes = createMockVotesCollection(null);

      mockGetCollection.mockResolvedValueOnce(mockReviews).mockResolvedValueOnce(mockVotes);

      const req = new Request(`http://localhost/api/reviews/${validId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ helpful: true }),
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const res = await POST(req, { params: Promise.resolve({ reviewId: validId }) });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.voted).toBe(true);
      expect(json.data.changed).toBe(true);

      expect(mockVotes.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          reviewId: expect.any(ObjectId),
          voterIdentifier: '192.168.1.1',
          helpful: true,
          createdAt: expect.any(Date),
          ipAddress: '192.168.1.1',
        })
      );

      expect(mockReviews.updateOne).toHaveBeenCalledWith(
        { _id: expect.any(ObjectId) },
        {
          $inc: { helpfulCount: 1 },
          $set: { updatedAt: expect.any(Date) },
        }
      );
    });

    it('creates unhelpful vote and increments unhelpfulCount', async () => {
      const validId = new ObjectId().toString();
      const mockReviews = createMockReviewsCollection({
        _id: new ObjectId(validId),
        status: 'approved',
      });
      const mockVotes = createMockVotesCollection(null);

      mockGetCollection.mockResolvedValueOnce(mockReviews).mockResolvedValueOnce(mockVotes);

      const req = new Request(`http://localhost/api/reviews/${validId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ helpful: false }),
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const res = await POST(req, { params: Promise.resolve({ reviewId: validId }) });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.voted).toBe(false);

      expect(mockReviews.updateOne).toHaveBeenCalledWith(
        { _id: expect.any(ObjectId) },
        {
          $inc: { unhelpfulCount: 1 },
          $set: { updatedAt: expect.any(Date) },
        }
      );
    });

    it('uses userId as voter identifier when provided', async () => {
      const validId = new ObjectId().toString();
      const mockReviews = createMockReviewsCollection({
        _id: new ObjectId(validId),
        status: 'approved',
      });
      const mockVotes = createMockVotesCollection(null);

      mockGetCollection.mockResolvedValueOnce(mockReviews).mockResolvedValueOnce(mockVotes);

      const req = new Request(`http://localhost/api/reviews/${validId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ helpful: true, userId: 'user-123' }),
      });

      const res = await POST(req, { params: Promise.resolve({ reviewId: validId }) });

      expect(res.status).toBe(200);
      expect(mockVotes.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          voterIdentifier: 'user-123',
        })
      );
    });

    it('returns success without change if vote already exists with same value', async () => {
      const validId = new ObjectId().toString();
      const existingVote = {
        _id: new ObjectId(),
        reviewId: new ObjectId(validId),
        voterIdentifier: '192.168.1.1',
        helpful: true,
      };
      const mockReviews = createMockReviewsCollection({
        _id: new ObjectId(validId),
        status: 'approved',
      });
      const mockVotes = createMockVotesCollection(existingVote);

      mockGetCollection.mockResolvedValueOnce(mockReviews).mockResolvedValueOnce(mockVotes);

      const req = new Request(`http://localhost/api/reviews/${validId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ helpful: true }),
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const res = await POST(req, { params: Promise.resolve({ reviewId: validId }) });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.voted).toBe(true);
      expect(json.data.changed).toBe(false);

      expect(mockVotes.updateOne).not.toHaveBeenCalled();
      expect(mockReviews.updateOne).not.toHaveBeenCalled();
    });

    it('updates existing vote when voter changes their mind', async () => {
      const validId = new ObjectId().toString();
      const voteId = new ObjectId();
      const existingVote = {
        _id: voteId,
        reviewId: new ObjectId(validId),
        voterIdentifier: '192.168.1.1',
        helpful: true,
      };
      const mockReviews = createMockReviewsCollection({
        _id: new ObjectId(validId),
        status: 'approved',
        helpfulCount: 5,
        unhelpfulCount: 2,
      });
      const mockVotes = createMockVotesCollection(existingVote);

      mockGetCollection.mockResolvedValueOnce(mockReviews).mockResolvedValueOnce(mockVotes);

      const req = new Request(`http://localhost/api/reviews/${validId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ helpful: false }),
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const res = await POST(req, { params: Promise.resolve({ reviewId: validId }) });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.voted).toBe(false);
      expect(json.data.changed).toBe(true);

      expect(mockVotes.updateOne).toHaveBeenCalledWith(
        { _id: voteId },
        {
          $set: {
            helpful: false,
            updatedAt: expect.any(Date),
          },
        }
      );

      expect(mockReviews.updateOne).toHaveBeenCalledWith(
        { _id: expect.any(ObjectId) },
        {
          $inc: {
            helpfulCount: -1,
            unhelpfulCount: 1,
          },
          $set: { updatedAt: expect.any(Date) },
        }
      );
    });

    it('handles errors gracefully', async () => {
      const validId = new ObjectId().toString();

      mockGetCollection.mockRejectedValueOnce(new Error('Database error'));

      const req = new Request(`http://localhost/api/reviews/${validId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ helpful: true }),
      });

      const res = await POST(req, { params: Promise.resolve({ reviewId: validId }) });

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe('Failed to record vote');
    });
  });

  describe('GET', () => {
    it('rejects invalid review ID', async () => {
      const req = new Request('http://localhost/api/reviews/invalid-id/vote');

      const res = await GET(req, { params: Promise.resolve({ reviewId: 'invalid-id' }) });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid review ID');
    });

    it('returns 404 when review does not exist', async () => {
      const validId = new ObjectId().toString();
      const mockReviews = {
        findOne: jest.fn().mockResolvedValue(null),
      };
      const mockVotes = {
        aggregate: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
        }),
      };

      mockGetCollection.mockResolvedValueOnce(mockReviews).mockResolvedValueOnce(mockVotes);

      const req = new Request(`http://localhost/api/reviews/${validId}/vote`);

      const res = await GET(req, { params: Promise.resolve({ reviewId: validId }) });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe('Review not found');
    });

    it('returns vote statistics for a review', async () => {
      const validId = new ObjectId().toString();
      const mockReviews = {
        findOne: jest.fn().mockResolvedValue({
          _id: new ObjectId(validId),
          helpfulCount: 15,
          unhelpfulCount: 3,
        }),
      };
      const mockVotes = {
        aggregate: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([
            { _id: true, count: 15, voters: ['user1', 'user2', 'user3'] },
            { _id: false, count: 3, voters: ['user4'] },
          ]),
        }),
      };

      mockGetCollection.mockResolvedValueOnce(mockReviews).mockResolvedValueOnce(mockVotes);

      const req = new Request(`http://localhost/api/reviews/${validId}/vote`);

      const res = await GET(req, { params: Promise.resolve({ reviewId: validId }) });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toMatchObject({
        reviewId: validId,
        votes: {
          helpful: 15,
          unhelpful: 3,
          total: 18,
          helpfulPercentage: '83.3',
        },
      });
    });

    it('returns zero statistics when no votes exist', async () => {
      const validId = new ObjectId().toString();
      const mockReviews = {
        findOne: jest.fn().mockResolvedValue({
          _id: new ObjectId(validId),
          helpfulCount: 0,
          unhelpfulCount: 0,
        }),
      };
      const mockVotes = {
        aggregate: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
        }),
      };

      mockGetCollection.mockResolvedValueOnce(mockReviews).mockResolvedValueOnce(mockVotes);

      const req = new Request(`http://localhost/api/reviews/${validId}/vote`);

      const res = await GET(req, { params: Promise.resolve({ reviewId: validId }) });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.votes).toMatchObject({
        helpful: 0,
        unhelpful: 0,
        total: 0,
        helpfulPercentage: '0.0',
      });
    });

    it('handles errors gracefully', async () => {
      const validId = new ObjectId().toString();

      mockGetCollection.mockRejectedValueOnce(new Error('Database error'));

      const req = new Request(`http://localhost/api/reviews/${validId}/vote`);

      const res = await GET(req, { params: Promise.resolve({ reviewId: validId }) });

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe('Failed to fetch vote statistics');
    });
  });
});
