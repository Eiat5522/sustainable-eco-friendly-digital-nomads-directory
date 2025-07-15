import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import UserAnalytics from '@/models/UserAnalytics';
import { auth } from '@/lib/auth';
import { NextRequest } from 'next/dist/server/web/spec-extension/request';
import { NextResponse } from 'next/dist/server/web/spec-extension/response';

/**
 * GET /api/user/analytics
 * Retrieve user analytics data
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';
    const includeHistory = searchParams.get('includeHistory') === 'true';

    await dbConnect();

    let analytics = await UserAnalytics.findOne({ userId: session.user.id }).lean();

    // Create default analytics if none exist
    if (!analytics) {
      const defaultAnalytics = new UserAnalytics({
        userId: session.user.id,
      });
      analytics = await defaultAnalytics.save();
    }    // Filter data based on time range
    let filteredAnalytics = analytics as any;
    
    if (filteredAnalytics && timeRange !== 'all') {
      const days = parseInt(timeRange.replace('d', '')) || 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Filter search patterns and view history by time range
      if (filteredAnalytics.engagement?.searchPatterns) {
        filteredAnalytics.engagement.searchPatterns = 
          filteredAnalytics.engagement.searchPatterns.filter(
            (pattern: any) => new Date(pattern.timestamp) >= cutoffDate
          );
      }

      if (filteredAnalytics.engagement?.viewHistory) {
        filteredAnalytics.engagement.viewHistory = 
          filteredAnalytics.engagement.viewHistory.filter(
            (view: any) => new Date(view.viewedAt) >= cutoffDate
          );
      }
    }

    // Optionally exclude detailed history for performance
    if (!includeHistory && filteredAnalytics?.engagement) {
      delete filteredAnalytics.engagement.searchPatterns;
      delete filteredAnalytics.engagement.viewHistory;
    }

    return NextResponse.json({
      success: true,
      data: filteredAnalytics,
      timeRange,
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/analytics
 * Track user analytics event
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { eventType, data } = body;

    if (!eventType) {
      return NextResponse.json(
        { error: 'Event type is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Initialize analytics document if it doesn't exist
    let analytics = await UserAnalytics.findOne({ userId: session.user.id });
    
    if (!analytics) {
      analytics = new UserAnalytics({ userId: session.user.id });
    }

    // Update analytics based on event type
    switch (eventType) {
      case 'session_start':
        analytics.activity.totalSessions += 1;
        analytics.activity.lastLogin = new Date();
        break;

      case 'page_view':
        analytics.activity.pageViews += 1;
        break;

      case 'search_query':
        analytics.activity.searchQueries += 1;
        if (data?.query && data?.resultsCount !== undefined) {
          analytics.engagement.searchPatterns.push({
            query: data.query,
            timestamp: new Date(),
            resultsCount: data.resultsCount,
          });
        }
        break;

      case 'listing_view':
        if (data?.listingId) {
          analytics.engagement.viewHistory.push({
            listingId: data.listingId,
            viewedAt: new Date(),
            timeSpent: data.timeSpent || 0,
          });
        }
        if (data?.category) {
          const categories = analytics.engagement.mostViewedCategories;
          const existingIndex = categories.indexOf(data.category);
          if (existingIndex === -1) {
            categories.push(data.category);
          }
        }
        break;

      case 'favorite_added':
        analytics.activity.favoritesAdded += 1;
        break;

      case 'review_submitted':
        analytics.activity.reviewsSubmitted += 1;
        break;

      case 'external_link_click':
        analytics.conversions.clickedExternalLinks += 1;
        break;

      case 'contact_form_completed':
        analytics.conversions.completedContactForms += 1;
        break;

      case 'premium_listing_view':
        analytics.conversions.premiumListingsViewed += 1;
        break;

      case 'map_interaction':
        analytics.conversions.mapInteractions += 1;
        break;

      case 'session_end':
        if (data?.duration) {
          // Update average session duration
          const totalSessions = analytics.activity.totalSessions;
          const currentAvg = analytics.activity.averageSessionDuration;
          analytics.activity.averageSessionDuration = 
            ((currentAvg * (totalSessions - 1)) + data.duration) / totalSessions;
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid event type' },
          { status: 400 }
        );
    }

    await analytics.save();

    return NextResponse.json({
      success: true,
      message: 'Analytics event tracked successfully',
    });
  } catch (error) {
    console.error('Track analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
