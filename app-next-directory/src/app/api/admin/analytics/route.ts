import { authOptions } from '@/lib/auth';
import { client } from '@/lib/sanity/client';
import { ApiResponseHandler } from '@/utils/api-response';
import { getServerSession } from 'next-auth/next';
import { NextRequest } from 'next/server';

interface AdminAnalytics {
  overview: {
    totalListings: number;
    totalUsers: number;
    totalReviews: number;
    totalBlogPosts: number;
    totalCities: number;
    totalEcoTags: number;
  };
  listingStats: {
    byCategory: { category: string; count: number }[];
    byCity: { city: string; count: number }[];
    byEcoRating: { rating: number; count: number }[];
    recentlyAdded: any[];
    mostViewed: any[];
  };
  userEngagement: {
    activeUsers: number;
    newSignupsThisMonth: number;
    usersByRole: { role: string; count: number }[];
    engagementTrends: any[];
  };
  contentMetrics: {
    averageReviewRating: number;
    reviewDistribution: { rating: number; count: number }[];
    blogPostViews: any[];
    featuredListings: any[];
  };
  performanceMetrics: {
    topPerformingListings: any[];
    conversionRates: any;
    searchAnalytics: any;
  };
}

async function getAdminAnalytics(): Promise<AdminAnalytics> {
  try {
    // Overview statistics
    const [
      totalListings,
      totalUsers,
      totalReviews,
      totalBlogPosts,
      totalCities,
      totalEcoTags
    ] = await Promise.all([
      client.fetch(`count(*[_type == "listing"])`),
      client.fetch(`count(*[_type == "user"])`),
      client.fetch(`count(*[_type == "review"])`),
      client.fetch(`count(*[_type == "blogPost"])`),
      client.fetch(`count(*[_type == "city"])`),
      client.fetch(`count(*[_type == "ecoTag"])`)
    ]);

    // Listing statistics
    const [
      listingsByCategory,
      listingsByCity,
      recentListings,
      listingsByEcoRating
    ] = await Promise.all([
      client.fetch(`
        *[_type == "listing"] | {
          "category": category,
        } | group(category) {
          "category": @.category,
          "count": count(@)
        }
      `),
      client.fetch(`
        *[_type == "listing" && defined(city)] {
          "city": city->name,
        } | group(city) {
          "city": @.city,
          "count": count(@)
        }
      `),
      client.fetch(`
        *[_type == "listing"] | order(_createdAt desc)[0...5] {
          _id,
          name,
          category,
          "city": city->name,
          _createdAt,
          "slug": slug.current
        }
      `),
      client.fetch(`
        *[_type == "listing" && defined(sustainabilityScore)] {
          "rating": sustainabilityScore,
        } | group(rating) {
          "rating": @.rating,
          "count": count(@)
        }
      `)
    ]);

    // User engagement metrics
    const [
      activeUsers,
      newUsers,
      usersByRole
    ] = await Promise.all([
      client.fetch(`count(*[_type == "user" && _updatedAt > now() - 30*24*60*60])`),
      client.fetch(`count(*[_type == "user" && _createdAt > now() - 30*24*60*60])`),
      client.fetch(`
        *[_type == "user"] {
          "role": role,
        } | group(role) {
          "role": @.role,
          "count": count(@)
        }
      `)
    ]);

    // Content metrics
    const [
      reviewStats,
      reviewDistribution,
      blogViews,
      featuredListings
    ] = await Promise.all([
      client.fetch(`
        *[_type == "review"] {
          rating
        } | {
          "average": math::avg(@.rating),
          "total": count(@)
        }
      `),
      client.fetch(`
        *[_type == "review"] {
          "rating": rating,
        } | group(rating) {
          "rating": @.rating,
          "count": count(@)
        }
      `),
      client.fetch(`
        *[_type == "blogPost"] | order(publishedAt desc)[0...5] {
          _id,
          title,
          "slug": slug.current,
          publishedAt,
          "viewCount": select(defined(analytics) => analytics.viewCount, 0)
        }
      `),
      client.fetch(`
        *[_type == "listing" && featured == true] {
          _id,
          name,
          category,
          "city": city->name,
          sustainabilityScore,
          "slug": slug.current
        }
      `)
    ]);

    // Performance metrics
    const [
      topListings,
      listingAnalytics
    ] = await Promise.all([
      client.fetch(`
        *[_type == "listingAnalytics"] | order(viewCount desc)[0...10] {
          "listing": listing->name,
          "listingSlug": listing->slug.current,
          "city": listing->city->name,
          viewCount,
          bookmarkCount,
          clickThroughRate,
          lastUpdated
        }
      `),
      client.fetch(`
        *[_type == "listingAnalytics"] {
          viewCount,
          bookmarkCount,
          clickThroughRate,
          timeOnPage
        }
      `)
    ]);

    return {
      overview: {
        totalListings,
        totalUsers,
        totalReviews,
        totalBlogPosts,
        totalCities,
        totalEcoTags
      },
      listingStats: {
        byCategory: listingsByCategory || [],
        byCity: listingsByCity || [],
        byEcoRating: listingsByEcoRating || [],
        recentlyAdded: recentListings || [],
        mostViewed: topListings.slice(0, 5) || []
      },
      userEngagement: {
        activeUsers,
        newSignupsThisMonth: newUsers,
        usersByRole: usersByRole || [],
        engagementTrends: []
      },
      contentMetrics: {
        averageReviewRating: reviewStats?.[0]?.average || 0,
        reviewDistribution: reviewDistribution || [],
        blogPostViews: blogViews || [],
        featuredListings: featuredListings || []
      },
      performanceMetrics: {
        topPerformingListings: topListings || [],
        conversionRates: {
          averageClickThroughRate: listingAnalytics.length > 0
            ? listingAnalytics.reduce((sum, item) => sum + (item.clickThroughRate || 0), 0) / listingAnalytics.length
            : 0,
          averageTimeOnPage: listingAnalytics.length > 0
            ? listingAnalytics.reduce((sum, item) => sum + (item.timeOnPage || 0), 0) / listingAnalytics.length
            : 0,
          totalViews: listingAnalytics.reduce((sum, item) => sum + (item.viewCount || 0), 0),
          totalBookmarks: listingAnalytics.reduce((sum, item) => sum + (item.bookmarkCount || 0), 0)
        },
        searchAnalytics: {
          totalSearches: 0, // To be implemented with search tracking
          popularSearchTerms: [],
          zeroResultSearches: 0
        }
      }
    };
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiResponseHandler.unauthorized();
    }

    if (session.user.role !== 'admin') {
      return ApiResponseHandler.forbidden();
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30'; // days
    const includeDetails = searchParams.get('includeDetails') === 'true';

    const analytics = await getAdminAnalytics();

    return ApiResponseHandler.success(analytics, 'Admin analytics retrieved successfully');
  } catch (error) {
    console.error('Admin analytics error:', error);
    return ApiResponseHandler.error('Failed to fetch admin analytics', 500);
  }
}
