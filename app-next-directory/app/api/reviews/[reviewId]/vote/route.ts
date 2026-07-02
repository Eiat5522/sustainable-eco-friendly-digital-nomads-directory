import { ObjectId } from 'mongodb';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getRequestContext, structuredLogger } from '@/lib/logger';
import { ApiResponseHandler } from '@/utils/api-response';
import { getCollection } from '@/utils/db-helpers';
import { getClientIPFromHeaders } from '@/utils/ip-utils';

const voteSchema = z.object({
  helpful: z.boolean(),
  userId: z.string().optional(), // For logged-in users
});

type ReviewDocument = {
  _id: ObjectId;
  status?: string;
  helpfulCount?: number;
  unhelpfulCount?: number;
};

type ReviewVoteDocument = {
  _id?: ObjectId;
  reviewId: ObjectId;
  voterIdentifier: string;
  helpful: boolean;
  createdAt: Date;
  updatedAt?: Date;
  ipAddress?: string;
};

type VoteStat = {
  _id: boolean;
  count: number;
  voters: string[];
};

// POST endpoint for voting on review helpfulness
type RouteContext = { params: Promise<{ reviewId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { reviewId } = await context.params;

    if (!ObjectId.isValid(reviewId)) {
      return ApiResponseHandler.error('Invalid review ID', 400);
    }

    const body = await request.json();
    const validationResult = voteSchema.safeParse(body);

    if (!validationResult.success) {
      return ApiResponseHandler.error('Invalid vote data', 400, validationResult.error.errors);
    }

    const { helpful, userId } = validationResult.data;
    const reviews = await getCollection('reviews');
    const reviewVotes = await getCollection('reviewVotes');

    // Check if review exists
    const review = (await reviews.findOne({
      _id: new ObjectId(reviewId),
      status: 'approved',
    })) as ReviewDocument | null;

    if (!review) {
      return ApiResponseHandler.notFound('Review');
    }

    // Use IP address if no user ID provided
    const voterIdentifier = userId || getClientIPFromHeaders(request.headers);

    // Check for existing vote
    const existingVote = (await reviewVotes.findOne({
      reviewId: new ObjectId(reviewId),
      voterIdentifier,
    })) as ReviewVoteDocument | null;

    if (existingVote) {
      const voteId = existingVote._id;
      // Update existing vote if different
      if (existingVote.helpful !== helpful && voteId) {
        await reviewVotes.updateOne(
          { _id: voteId },
          {
            $set: {
              helpful,
              updatedAt: new Date(),
            },
          }
        );

        // Update review helpful counts
        const helpfulDelta = helpful ? 1 : -1;
        const unhelpfulDelta = helpful ? -1 : 1;

        await reviews.updateOne(
          { _id: new ObjectId(reviewId) },
          {
            $inc: {
              helpfulCount: helpfulDelta,
              unhelpfulCount: unhelpfulDelta,
            },
            $set: { updatedAt: new Date() },
          }
        );

        return ApiResponseHandler.success(
          { voted: helpful, changed: true },
          'Vote updated successfully'
        );
      } else {
        return ApiResponseHandler.success(
          { voted: helpful, changed: false },
          'Vote already recorded'
        );
      }
    }

    // Create new vote
    await reviewVotes.insertOne({
      reviewId: new ObjectId(reviewId),
      voterIdentifier,
      helpful,
      createdAt: new Date(),
      ipAddress: getClientIPFromHeaders(request.headers),
    });

    // Update review helpful counts
    const updateField = helpful ? 'helpfulCount' : 'unhelpfulCount';
    await reviews.updateOne(
      { _id: new ObjectId(reviewId) },
      {
        $inc: { [updateField]: 1 },
        $set: { updatedAt: new Date() },
      }
    );

    return ApiResponseHandler.success(
      { voted: helpful, changed: true },
      'Vote recorded successfully'
    );
  } catch (error) {
    structuredLogger.error('Failed to record review vote', error, {
      ...getRequestContext(request),
      component: 'api/reviews/[reviewId]/vote',
    });
    return ApiResponseHandler.error('Failed to record vote', 500);
  }
}

// GET endpoint for getting vote statistics
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { reviewId } = await context.params;

    if (!ObjectId.isValid(reviewId)) {
      return ApiResponseHandler.error('Invalid review ID', 400);
    }

    const reviews = await getCollection('reviews');
    const reviewVotes = await getCollection('reviewVotes');

    // Get review with vote counts
    const review = (await reviews.findOne(
      { _id: new ObjectId(reviewId) },
      { projection: { helpfulCount: 1, unhelpfulCount: 1 } }
    )) as ReviewDocument | null;

    if (!review) {
      return ApiResponseHandler.notFound('Review');
    }

    // Get detailed vote breakdown
    const aggregation = (
      reviewVotes as {
        aggregate: (pipeline?: Record<string, unknown>[]) => { toArray: () => Promise<unknown[]> };
      }
    ).aggregate([
      { $match: { reviewId: new ObjectId(reviewId) } },
      {
        $group: {
          _id: '$helpful',
          count: { $sum: 1 },
          voters: { $addToSet: '$voterIdentifier' },
        },
      },
    ]);
    const voteStats = (await aggregation.toArray()) as VoteStat[];

    const helpful = voteStats.find(v => v._id === true)?.count ?? 0;
    const unhelpful = voteStats.find(v => v._id === false)?.count ?? 0;
    const total = helpful + unhelpful;

    const response = {
      reviewId,
      votes: {
        helpful,
        unhelpful,
        total,
        helpfulPercentage: total > 0 ? ((helpful / total) * 100).toFixed(1) : '0.0',
      },
      // Check if current user/IP has voted
      userVote: null, // Would need to implement user session checking
    };

    return ApiResponseHandler.success(response);
  } catch (error) {
    structuredLogger.error('Failed to fetch review vote statistics', error, {
      ...getRequestContext(request),
      component: 'api/reviews/[reviewId]/vote',
    });
    return ApiResponseHandler.error('Failed to fetch vote statistics', 500);
  }
}
