import { ApiResponseHandler } from '@/utils/api-response';
import { getCollection } from '@/utils/db-helpers';
import { rateLimit } from '@/utils/rate-limit';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const createReviewSchema = z.object({
  listingSlug: z.string().min(1, 'Listing slug is required'),
  rating: z.number().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(2000, 'Comment too long'),
  reviewerName: z.string().min(2, 'Reviewer name must be at least 2 characters').max(100, 'Name too long'),
  reviewerEmail: z.string().email('Valid email is required'),
  stayDate: z.string().optional(), // When they stayed (YYYY-MM format)
  categories: z.object({
    cleanliness: z.number().min(1).max(5).optional(),
    location: z.number().min(1).max(5).optional(),
    value: z.number().min(1).max(5).optional(),
    sustainability: z.number().min(1).max(5).optional(),
    amenities: z.number().min(1).max(5).optional(),
  }).optional(),
  wouldRecommend: z.boolean().optional(),
  photos: z.array(z.string().url()).max(5, 'Maximum 5 photos allowed').optional(),
});

// Rate limiting for review submissions
const reviewLimiter = rateLimit({
  max: 3, // Maximum 3 reviews per hour
  windowMs: 60 * 60 * 1000, // 1 hour window
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listingSlug = searchParams.get('listing');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '10'));
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // createdAt, rating, helpful
    const filterRating = searchParams.get('rating');
    const verified = searchParams.get('verified') === 'true';

    const reviews = await getCollection('reviews');

    // Build filter
    const filter: any = { status: 'approved' };
    if (listingSlug) filter.listingSlug = listingSlug;
    if (filterRating) filter.rating = parseInt(filterRating);
    if (verified) filter.verified = true;

    // Build sort
    const sort: any = {};
    switch (sortBy) {
      case 'rating':
        sort.rating = -1;
        break;
      case 'helpful':
        sort.helpfulCount = -1;
        break;
      default:
        sort.createdAt = -1;
    }

    const skip = (page - 1) * limit;

    const [results, total, summary] = await Promise.all([
      reviews.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray(),
      reviews.countDocuments(filter),
      // Get review summary for the listing
      listingSlug ? reviews.aggregate([
        { $match: { listingSlug, status: 'approved' } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
            ratingBreakdown: {
              $push: '$rating'
            },
            avgCategories: {
              $avg: {
                cleanliness: '$categories.cleanliness',
                location: '$categories.location',
                value: '$categories.value',
                sustainability: '$categories.sustainability',
                amenities: '$categories.amenities',
              }
            }
          }
        }
      ]).toArray() : []
    ]);

    // Calculate rating distribution for listing summary
    let ratingDistribution = {};
    if (summary.length > 0) {
      const ratings = summary[0].ratingBreakdown;
      ratingDistribution = {
        5: ratings.filter((r: number) => r === 5).length,
        4: ratings.filter((r: number) => r === 4).length,
        3: ratings.filter((r: number) => r === 3).length,
        2: ratings.filter((r: number) => r === 2).length,
        1: ratings.filter((r: number) => r === 1).length,
      };
    }

    const response = {
      reviews: results.map(review => ({
        ...review,
        // Hide email from public response
        reviewerEmail: undefined,
        isVerified: review.verified || false,
        isHelpful: review.helpfulCount > 0,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      summary: summary.length > 0 ? {
        avgRating: Number(summary[0].avgRating?.toFixed(2)) || 0,
        totalReviews: summary[0].totalReviews || 0,
        ratingDistribution,
        categoryAverages: summary[0].avgCategories ? {
          cleanliness: Number(summary[0].avgCategories.cleanliness?.toFixed(2)) || 0,
          location: Number(summary[0].avgCategories.location?.toFixed(2)) || 0,
          value: Number(summary[0].avgCategories.value?.toFixed(2)) || 0,
          sustainability: Number(summary[0].avgCategories.sustainability?.toFixed(2)) || 0,
          amenities: Number(summary[0].avgCategories.amenities?.toFixed(2)) || 0,
        } : null,
      } : null,
      filters: {
        sortBy,
        filterRating: filterRating ? parseInt(filterRating) : null,
        verified,
      }
    };

    return ApiResponseHandler.success(response);

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return ApiResponseHandler.error('Failed to fetch reviews', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await reviewLimiter(request);
    if (!rateLimitResult.success) {
      return ApiResponseHandler.error('Too many review submissions. Please try again later.', 429);
    }

    const body = await request.json();
    const validationResult = createReviewSchema.safeParse(body);

    if (!validationResult.success) {
      return ApiResponseHandler.error(
        'Invalid review data',
        400,
        validationResult.error.errors
      );
    }

    const validatedData = validationResult.data;
    const reviews = await getCollection('reviews');

    // Check for duplicate reviews (same email + listing)
    const existingReview = await reviews.findOne({
      listingSlug: validatedData.listingSlug,
      reviewerEmail: validatedData.reviewerEmail,
      status: { $in: ['approved', 'pending'] }
    });

    if (existingReview) {
      return ApiResponseHandler.error(
        'You have already submitted a review for this listing',
        409
      );
    }

    // Basic spam/quality checks
    const spamScore = calculateSpamScore(validatedData.comment, validatedData.reviewerName);
    const autoApprove = spamScore < 0.3; // Low spam score = auto-approve

    // Calculate overall categories average if provided
    let categoriesAvg = null;
    if (validatedData.categories) {
      const cats = validatedData.categories;
      const values = Object.values(cats).filter(v => v !== undefined) as number[];
      categoriesAvg = values.length > 0 ?
        values.reduce((a, b) => a + b, 0) / values.length : null;
    }

    const newReview = {
      ...validatedData,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: autoApprove ? 'approved' : 'pending',
      flagCount: 0,
      helpfulCount: 0,
      verified: false, // Will be set to true if user is verified
      spamScore,
      categoriesAverage: categoriesAvg,
      moderationHistory: [],
      ipAddress: request.ip || 'unknown',
    };

    const result = await reviews.insertOne(newReview);

    // Update listing stats if auto-approved
    if (autoApprove) {
      await updateListingReviewStats(validatedData.listingSlug);
    }

    // Send notification email to listing owner (async)
    notifyListingOwner(validatedData.listingSlug, newReview).catch(console.error);

    return ApiResponseHandler.success(
      {
        id: result.insertedId,
        status: newReview.status,
        autoApproved: autoApprove,
      },
      autoApprove ?
        'Review submitted and approved successfully!' :
        'Review submitted successfully and is pending approval'
    );

  } catch (error) {
    console.error('Error creating review:', error);
    return ApiResponseHandler.error('Failed to create review', 500);
  }
}

// Helper function to calculate spam score
function calculateSpamScore(comment: string, name: string): number {
  let score = 0;

  // Check for spam indicators
  const spamKeywords = ['casino', 'viagra', 'loan', 'investment', 'crypto', 'bitcoin', 'click here', 'buy now'];
  const text = `${comment} ${name}`.toLowerCase();

  spamKeywords.forEach(keyword => {
    if (text.includes(keyword)) score += 0.3;
  });

  // Check for excessive caps
  const capsRatio = (comment.match(/[A-Z]/g) || []).length / comment.length;
  if (capsRatio > 0.5) score += 0.2;

  // Check for excessive punctuation
  const punctRatio = (comment.match(/[!?]{2,}/g) || []).length;
  if (punctRatio > 2) score += 0.2;

  // Check for repeated characters
  if (/(.)\1{4,}/.test(comment)) score += 0.2;

  return Math.min(score, 1); // Cap at 1.0
}

// Helper function to update listing review statistics
async function updateListingReviewStats(listingSlug: string) {
  try {
    const reviews = await getCollection('reviews');
    const stats = await reviews.aggregate([
      { $match: { listingSlug, status: 'approved' } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
          lastReviewDate: { $max: '$createdAt' },
        }
      }
    ]).toArray();

    if (stats.length > 0) {
      const listings = await getCollection('listings');
      await listings.updateOne(
        { slug: listingSlug },
        {
          $set: {
            avgRating: Number(stats[0].avgRating.toFixed(2)),
            reviewCount: stats[0].reviewCount,
            lastReviewDate: stats[0].lastReviewDate,
            updatedAt: new Date(),
          }
        }
      );
    }
  } catch (error) {
    console.error('Error updating listing stats:', error);
  }
}

// Helper function to notify listing owner
async function notifyListingOwner(listingSlug: string, review: any) {
  try {
    // This would integrate with your email service
    // Implementation depends on your notification system
    console.log(`New review notification for listing ${listingSlug}:`, {
      rating: review.rating,
      reviewer: review.reviewerName,
      status: review.status,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}
