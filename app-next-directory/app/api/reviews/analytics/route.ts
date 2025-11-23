import type { Collection, Document } from 'mongodb';
import { ApiResponseHandler } from '@/utils/api-response';
import { getCollection } from '@/utils/db-helpers';
import { getRequestContext, structuredLogger } from '@/lib/logger';

type ReviewFilter = {
  createdAt: { $gte: Date };
  status: 'approved';
  listingSlug?: string;
};

type OverallStatsDoc = {
  _id: null;
  totalReviews: number;
  avgRating: number;
  minRating: number;
  maxRating: number;
  uniqueListings: string[];
};

type RatingBucket = { _id: number; count: number };
type TrendBucket = { _id: string; count: number; avgRating: number };
type TopListingBucket = { _id: string; avgRating: number; reviewCount: number };
type ModerationBucket = { _id: string; count: number };
type SentimentBucket = { _id: string; count: number; avgRating: number };
type ResponseTimeBucket = {
  _id: null;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  totalModerated: number;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';
    const listingSlug = searchParams.get('listing');

    const reviews = (await getCollection('reviews')) as Collection<Document>;

    const now = new Date();
    const startDate = (() => {
      switch (timeRange) {
        case '7d':
          return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case '90d':
          return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        case '1y':
          return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        default:
          return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    })();

    const baseFilter: ReviewFilter = {
      createdAt: { $gte: startDate },
      status: 'approved',
    };
    if (listingSlug) {
      baseFilter.listingSlug = listingSlug;
    }

    const overallStatsPromise = reviews.aggregate<OverallStatsDoc>([
      { $match: baseFilter },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          minRating: { $min: '$rating' },
          maxRating: { $max: '$rating' },
          uniqueListings: { $addToSet: '$listingSlug' },
        },
      },
    ]).toArray();

    const ratingDistributionPromise = reviews.aggregate<RatingBucket>([
      { $match: baseFilter },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).toArray();

    const trendsPromise = reviews.aggregate<TrendBucket>([
      { $match: baseFilter },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' },
        },
      },
      { $sort: { _id: 1 } },
    ]).toArray();

    const topListingsPromise = listingSlug
      ? Promise.resolve([] as TopListingBucket[])
      : reviews.aggregate<TopListingBucket>([
          { $match: baseFilter },
          {
            $group: {
              _id: '$listingSlug',
              avgRating: { $avg: '$rating' },
              reviewCount: { $sum: 1 },
            },
          },
          { $match: { reviewCount: { $gte: 3 } } },
          { $sort: { avgRating: -1, reviewCount: -1 } },
          { $limit: 10 },
        ]).toArray();

    const moderationPromise = reviews.aggregate<ModerationBucket>([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]).toArray();

    const sentimentPromise = reviews.aggregate<SentimentBucket>([
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
                      regex: /excellent|amazing|fantastic|wonderful|perfect|outstanding/i,
                    },
                  },
                  then: 'very_positive',
                },
                {
                  case: {
                    $regexMatch: {
                      input: '$comment',
                      regex: /good|great|nice|pleasant|satisfied|recommend/i,
                    },
                  },
                  then: 'positive',
                },
                {
                  case: {
                    $regexMatch: {
                      input: '$comment',
                      regex: /terrible|awful|horrible|worst|hate|disgusting/i,
                    },
                  },
                  then: 'very_negative',
                },
                {
                  case: {
                    $regexMatch: {
                      input: '$comment',
                      regex: /bad|poor|disappointing|not good|issues|problems/i,
                    },
                  },
                  then: 'negative',
                },
              ],
              default: 'neutral',
            },
          },
        },
      },
      {
        $group: {
          _id: '$sentiment',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' },
        },
      },
    ]).toArray();

    const responseTimePromise = reviews.aggregate<ResponseTimeBucket>([
      {
        $match: {
          createdAt: { $gte: startDate },
          moderatedAt: { $exists: true },
        },
      },
      {
        $project: {
          responseTimeHours: {
            $divide: [
              { $subtract: ['$moderatedAt', '$createdAt'] },
              1000 * 60 * 60,
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTimeHours' },
          minResponseTime: { $min: '$responseTimeHours' },
          maxResponseTime: { $max: '$responseTimeHours' },
          totalModerated: { $sum: 1 },
        },
      },
    ]).toArray();

    const [
      overallStats,
      ratingDistribution,
      trendsData,
      topListings,
      moderationStats,
      sentimentAnalysis,
      responseTimeStats,
    ] = await Promise.all([
      overallStatsPromise,
      ratingDistributionPromise,
      trendsPromise,
      topListingsPromise,
      moderationPromise,
      sentimentPromise,
      responseTimePromise,
    ]);

    const overall = overallStats[0] || {
      totalReviews: 0,
      avgRating: 0,
      minRating: 0,
      maxRating: 0,
      uniqueListings: [],
    };

    const distribution = Array.from({ length: 5 }, (_, index) => {
      const rating = index + 1;
      const bucket = ratingDistribution.find((entry) => entry._id === rating);
      const count = bucket?.count ?? 0;
      const percentage = overall.totalReviews > 0 ? ((count / overall.totalReviews) * 100).toFixed(1) : '0.0';
      return { rating, count, percentage };
    });

    const moderationCounts = {
      pending: moderationStats.find((entry) => entry._id === 'pending')?.count ?? 0,
      approved: moderationStats.find((entry) => entry._id === 'approved')?.count ?? 0,
      rejected: moderationStats.find((entry) => entry._id === 'rejected')?.count ?? 0,
      flagged: moderationStats.find((entry) => entry._id === 'flagged')?.count ?? 0,
    };

    const moderationTotal = Object.values(moderationCounts).reduce((sum, value) => sum + value, 0);

    const sentimentBreakdown = sentimentAnalysis.map((entry) => ({
      sentiment: entry._id,
      count: entry.count,
      avgRating: Number(entry.avgRating?.toFixed(2)) || 0,
      percentage: overall.totalReviews > 0 ? ((entry.count / overall.totalReviews) * 100).toFixed(1) : '0.0',
    }));

    const responseTimeInfo = responseTimeStats[0]
      ? {
          avgHours: Number(responseTimeStats[0].avgResponseTime?.toFixed(2)) || 0,
          minHours: Number(responseTimeStats[0].minResponseTime?.toFixed(2)) || 0,
          maxHours: Number(responseTimeStats[0].maxResponseTime?.toFixed(2)) || 0,
          totalModerated: responseTimeStats[0].totalModerated || 0,
        }
      : null;

    const analytics = {
      timeRange,
      overall: {
        totalReviews: overall.totalReviews,
        avgRating: Number(overall.avgRating?.toFixed(2)) || 0,
        minRating: overall.minRating,
        maxRating: overall.maxRating,
        uniqueListings: overall.uniqueListings,
        uniqueListingsCount: overall.uniqueListings.length,
      },
      distribution,
      trends: trendsData.map((entry) => ({
        date: entry._id,
        count: entry.count,
        avgRating: Number(entry.avgRating?.toFixed(2)) || 0,
      })),
      sentiment: sentimentBreakdown,
      moderation: {
        ...moderationCounts,
        total: moderationTotal,
        approvalRate:
          moderationCounts.approved + moderationCounts.rejected > 0
            ? (
                (moderationCounts.approved /
                  (moderationCounts.approved + moderationCounts.rejected)) *
                100
              ).toFixed(1)
            : '0.0',
      },
      responseTime: responseTimeInfo,
      topListings: listingSlug
        ? undefined
        : topListings.map((listing) => ({
            slug: listing._id,
            avgRating: Number(listing.avgRating?.toFixed(2)) || 0,
            reviewCount: listing.reviewCount,
          })),
    };

    return ApiResponseHandler.success(
      analytics,
      `Analytics data for ${timeRange} period`
    );
  } catch (error) {
    structuredLogger.error('Failed to fetch review analytics', error, {
      ...getRequestContext(request),
      component: 'api/reviews/analytics',
    });
    return ApiResponseHandler.error('Failed to fetch review analytics', 500);
  }
}
