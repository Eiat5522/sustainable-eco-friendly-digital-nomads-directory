import { ApiResponseHandler } from '@/utils/api-response';
import { getCollection } from '@/utils/db-helpers';
import { ObjectId } from 'mongodb';
import { NextRequest } from 'next/dist/server/web/spec-extension/request';
import { z } from 'zod';

const moderationActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'flag']),
  reason: z.string().optional(),
  moderatorId: z.string().min(1, 'Moderator ID is required'),
});

const bulkModerationSchema = z.object({
  reviewIds: z.array(z.string()),
  action: z.enum(['approve', 'reject', 'flag']),
  reason: z.string().optional(),
  moderatorId: z.string().min(1, 'Moderator ID is required'),
});

// GET endpoint for fetching reviews pending moderation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const priority = searchParams.get('priority'); // high, medium, low
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // createdAt, rating, flagCount

    const reviews = await getCollection('reviews');

    // Build filter
    const filter: any = { status };

    if (priority) {
      switch (priority) {
        case 'high':
          filter.flagCount = { $gte: 3 };
          break;
        case 'medium':
          filter.flagCount = { $gte: 1, $lt: 3 };
          break;
        case 'low':
          filter.flagCount = { $lt: 1 };
          break;
      }
    }

    // Build sort
    const sort: any = {};
    switch (sortBy) {
      case 'rating':
        sort.rating = -1;
        break;
      case 'flagCount':
        sort.flagCount = -1;
        break;
      default:
        sort.createdAt = -1;
    }

    const skip = (page - 1) * limit;

    const [results, total, stats] = await Promise.all([
      reviews.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray(),
      reviews.countDocuments(filter),
      reviews.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgRating: { $avg: '$rating' }
          }
        }
      ]).toArray()
    ]);

    // Get priority counts
    const priorityCounts = await reviews.aggregate([
      { $match: { status: 'pending' } },
      {
        $group: {
          _id: {
            $cond: [
              { $gte: ['$flagCount', 3] }, 'high',
              { $cond: [{ $gte: ['$flagCount', 1] }, 'medium', 'low'] }
            ]
          },
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    return ApiResponseHandler.success({
      reviews: results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        byStatus: stats,
        byPriority: priorityCounts,
        totalPending: stats.find(s => s._id === 'pending')?.count || 0,
        totalApproved: stats.find(s => s._id === 'approved')?.count || 0,
        totalRejected: stats.find(s => s._id === 'rejected')?.count || 0,
      }
    });

  } catch (error) {
    console.error('Error fetching moderation queue:', error);
    return ApiResponseHandler.error('Failed to fetch reviews for moderation', 500);
  }
}

// PUT endpoint for moderating individual reviews
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewId, ...actionData } = body;

    if (!reviewId) {
      return ApiResponseHandler.error('Review ID is required', 400);
    }

    const validationResult = moderationActionSchema.safeParse(actionData);
    if (!validationResult.success) {
      return ApiResponseHandler.error(
        'Invalid moderation data',
        400,
        validationResult.error.errors
      );
    }

    const { action, reason, moderatorId } = validationResult.data;
    const reviews = await getCollection('reviews');

    // Find the review
    const review = await reviews.findOne({ _id: new ObjectId(reviewId) });
    if (!review) {
      return ApiResponseHandler.notFound('Review');
    }

    // Update review status and add moderation history
    const updateData: any = {
      status: action === 'flag' ? 'flagged' : action === 'approve' ? 'approved' : 'rejected',
      moderatedAt: new Date(),
      moderatedBy: moderatorId,
      $push: {
        moderationHistory: {
          action,
          reason,
          moderatorId,
          timestamp: new Date(),
        }
      }
    };

    if (action === 'flag') {
      updateData.$inc = { flagCount: 1 };
    }

    const result = await reviews.updateOne(
      { _id: new ObjectId(reviewId) },
      updateData
    );

    if (result.matchedCount === 0) {
      return ApiResponseHandler.notFound('Review');
    }

    // Update listing featured status if needed
    if (action === 'approve') {
      await updateListingFeaturedStatus(review.listingSlug);
    }

    // Log moderation action
    await logModerationAction({
      reviewId,
      action,
      reason,
      moderatorId,
      listingSlug: review.listingSlug,
    });

    return ApiResponseHandler.success(
      { reviewId, action, status: updateData.status },
      `Review ${action}ed successfully`
    );

  } catch (error) {
    console.error('Error moderating review:', error);
    return ApiResponseHandler.error('Failed to moderate review', 500);
  }
}

// POST endpoint for bulk moderation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = bulkModerationSchema.safeParse(body);

    if (!validationResult.success) {
      return ApiResponseHandler.error(
        'Invalid bulk moderation data',
        400,
        validationResult.error.errors
      );
    }

    const { reviewIds, action, reason, moderatorId } = validationResult.data;
    const reviews = await getCollection('reviews');

    // Convert string IDs to ObjectIds
    const objectIds = reviewIds.map(id => new ObjectId(id));

    // Get reviews to update
    const reviewsToUpdate = await reviews.find({
      _id: { $in: objectIds }
    }).toArray();

    if (reviewsToUpdate.length === 0) {
      return ApiResponseHandler.error('No reviews found to moderate', 404);
    }

    // Bulk update
    const updateData: any = {
      status: action === 'flag' ? 'flagged' : action === 'approve' ? 'approved' : 'rejected',
      moderatedAt: new Date(),
      moderatedBy: moderatorId,
      $push: {
        moderationHistory: {
          action,
          reason,
          moderatorId,
          timestamp: new Date(),
        }
      }
    };

    if (action === 'flag') {
      updateData.$inc = { flagCount: 1 };
    }

    const result = await reviews.updateMany(
      { _id: { $in: objectIds } },
      updateData
    );

    // Update featured status for affected listings
    if (action === 'approve') {
      const uniqueListings = [...new Set(reviewsToUpdate.map(r => r.listingSlug))];
      await Promise.all(
        uniqueListings.map(slug => updateListingFeaturedStatus(slug))
      );
    }

    // Log bulk moderation actions
    await Promise.all(
      reviewsToUpdate.map(review =>
        logModerationAction({
          reviewId: review._id.toString(),
          action,
          reason,
          moderatorId,
          listingSlug: review.listingSlug,
        })
      )
    );

    return ApiResponseHandler.success(
      {
        moderated: result.modifiedCount,
        total: reviewIds.length,
        action,
      },
      `${result.modifiedCount} reviews ${action}ed successfully`
    );

  } catch (error) {
    console.error('Error in bulk moderation:', error);
    return ApiResponseHandler.error('Failed to perform bulk moderation', 500);
  }
}

// Helper function to update listing featured status
async function updateListingFeaturedStatus(listingSlug: string) {
  try {
    const reviews = await getCollection('reviews');

    // Calculate average rating and review count
    const stats = await reviews.aggregate([
      { $match: { listingSlug, status: 'approved' } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
          recentReviews: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                1,
                0
              ]
            }
          }
        }
      }
    ]).toArray();

    if (stats.length === 0) return;

    const { avgRating, reviewCount, recentReviews } = stats[0];

    // Featured listing criteria
    const isFeatured =
      avgRating >= 4.5 &&
      reviewCount >= 5 &&
      recentReviews >= 2;

    // Update listing in Sanity or database
    const listings = await getCollection('listings');
    await listings.updateOne(
      { slug: listingSlug },
      {
        $set: {
          featured: isFeatured,
          avgRating,
          reviewCount,
          lastReviewUpdate: new Date(),
        }
      }
    );

  } catch (error) {
    console.error('Error updating listing featured status:', error);
  }
}

// Helper function to log moderation actions
async function logModerationAction(actionData: any) {
  try {
    const moderationLogs = await getCollection('moderationLogs');
    await moderationLogs.insertOne({
      ...actionData,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error logging moderation action:', error);
  }
}
