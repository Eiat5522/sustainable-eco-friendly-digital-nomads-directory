import { ApiResponseHandler } from '@/utils/api-response';
import { getCollection } from '@/utils/db-helpers';
import { NextRequest } from 'next/server';

// GET endpoint for review analytics and insights
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d'; // 7d, 30d, 90d, 1y
    const listingSlug = searchParams.get('listing');

    const reviews = await getCollection('reviews');

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build base filter
    const baseFilter: any = {
      createdAt: { $gte: startDate },
      status: 'approved'
    };

    if (listingSlug) {
      baseFilter.listingSlug = listingSlug;
    }

    // Parallel analytics queries
    const [
      overallStats,
      ratingDistribution,
      trendsData,
      topListings,
      moderationStats,
      sentimentAnalysis,
      responseTimeStats
    ] = await Promise.all([
      // Overall statistics
      reviews.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            avgRating: { $avg: '$rating' },
            minRating: { $min: '$rating' },
            maxRating: { $max: '$rating' },
            uniqueListings: { $addToSet: '$listingSlug' }
          }
        }
      ]).toArray(),

      // Rating distribution
      reviews.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]).toArray(),

      // Trends over time (daily for last 30 days)
      reviews.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 },
            avgRating: { $avg: '$rating' }
          }
        },
        { $sort: { _id: 1 } }
      ]).toArray(),

      // Top-rated listings (if not filtering by listing)
      !listingSlug ? reviews.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: '$listingSlug',
            avgRating: { $avg: '$rating' },
            reviewCount: { $sum: 1 }
          }
        },
        { $match: { reviewCount: { $gte: 3 } } },
        { $sort: { avgRating: -1, reviewCount: -1 } },
        { $limit: 10 }
      ]).toArray() : [],

      // Moderation statistics
      reviews.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]).toArray(),

      // Basic sentiment analysis (based on keywords)
      reviews.aggregate([
        { $match: baseFilter },
        {
          $project: {
            rating: 1,
            sentiment: {
              $switch: {
                branches: [
                  {
                    case: {
                      $regexMatch: {
                        input: '$comment',
                        regex: /excellent|amazing|fantastic|wonderful|perfect|outstanding/i
                      }
                    },
                    then: 'very_positive'
                  },
                  {
                    case: {
                      $regexMatch: {
                        input: '$comment',
                        regex: /good|great|nice|pleasant|satisfied|recommend/i
                      }
                    },
                    then: 'positive'
                  },
                  {
                    case: {
                      $regexMatch: {
                        input: '$comment',
                        regex: /terrible|awful|horrible|worst|hate|disgusting/i
                      }
                    },
                    then: 'very_negative'
                  },
                  {
                    case: {
                      $regexMatch: {
                        input: '$comment',
                        regex: /bad|poor|disappointing|not good|issues|problems/i
                      }
                    },
                    then: 'negative'
                  }
                ],
                default: 'neutral'
              }
            }
          }
        },
        {
          $group: {
            _id: '$sentiment',
            count: { $sum: 1 },
            avgRating: { $avg: '$rating' }
          }
        }
      ]).toArray(),

      // Response time stats (for moderation)
      reviews.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            moderatedAt: { $exists: true }
          }
        },
        {
          $project: {
            responseTimeHours: {
              $divide: [
                { $subtract: ['$moderatedAt', '$createdAt'] },
                1000 * 60 * 60 // Convert to hours
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            avgResponseTime: { $avg: '$responseTimeHours' },
            minResponseTime: { $min: '$responseTimeHours' },
            maxResponseTime: { $max: '$responseTimeHours' },
            totalModerated: { $sum: 1 }
          }
        }
      ]).toArray()
    ]);

    // Process results
    const overall = overallStats[0] || {
      totalReviews: 0,
      avgRating: 0,
      minRating: 0,
      maxRating: 0,
      uniqueListings: []
    };

    const distribution = Array.from({ length: 5 }, (_, i) => {
      const rating = i + 1;
      const found = ratingDistribution.find(r => r._id === rating);
      return {
        rating,
        count: found?.count || 0,
        percentage: overall.totalReviews > 0 ?
          ((found?.count || 0) / overall.totalReviews * 100).toFixed(1) : '0.0'
      };
    });

    const moderation = {
      pending: moderationStats.find(s => s._id === 'pending')?.count || 0,
      approved: moderationStats.find(s => s._id === 'approved')?.count || 0,
      rejected: moderationStats.find(s => s._id === 'rejected')?.count || 0,
      flagged: moderationStats.find(s => s._id === 'flagged')?.count || 0,
    };

    const response = {
      timeRange,
      overall: {
        ...overall,
        uniqueListingsCount: overall.uniqueListings.length,
        avgRating: Number(overall.avgRating?.toFixed(2)) || 0,
      },
      distribution,
      trends: trendsData.map(d => ({
        date: d._id,
        count: d.count,
        avgRating: Number(d.avgRating?.toFixed(2)) || 0,
      })),
      sentiment: sentimentAnalysis.map(s => ({
        sentiment: s._id,
        count: s.count,
        avgRating: Number(s.avgRating?.toFixed(2)) || 0,
        percentage: overall.totalReviews > 0 ?
          (s.count / overall.totalReviews * 100).toFixed(1) : '0.0'
      })),
      moderation: {
        ...moderation,
        total: Object.values(moderation).reduce((a: number, b: number) => a + b, 0),
        approvalRate: moderation.approved + moderation.rejected > 0 ?
          (moderation.approved / (moderation.approved + moderation.rejected) * 100).toFixed(1) : '0.0'
      },
      responseTime: responseTimeStats[0] ? {
        avgHours: Number(responseTimeStats[0].avgResponseTime?.toFixed(2)) || 0,
        minHours: Number(responseTimeStats[0].minResponseTime?.toFixed(2)) || 0,
        maxHours: Number(responseTimeStats[0].maxResponseTime?.toFixed(2)) || 0,
        totalModerated: responseTimeStats[0].totalModerated || 0,
      } : null,
      topListings: !listingSlug ? topListings.map(l => ({
        slug: l._id,
        avgRating: Number(l.avgRating?.toFixed(2)) || 0,
        reviewCount: l.reviewCount,
      })) : null,
    };

    return ApiResponseHandler.success(
      response,
      `Analytics data for ${timeRange} period`
    );

  } catch (error) {
    console.error('Error fetching review analytics:', error);
    return ApiResponseHandler.error('Failed to fetch review analytics', 500);
  }
}
