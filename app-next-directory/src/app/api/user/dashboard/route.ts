import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import UserFavorite from '@/models/UserFavorite';
import UserAnalytics from '@/models/UserAnalytics';
import UserPreferences from '@/models/UserPreferences';
import User from '@/models/User';
import { getUserById } from '@/lib/auth/serverAuth';
import { auth } from '@/lib/auth';
import { NextRequest } from 'next/dist/server/web/spec-extension/request';
import { NextResponse } from 'next/dist/server/web/spec-extension/response';

/**
 * GET /api/user/dashboard
 * Retrieve comprehensive dashboard data for the current user
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

    await dbConnect();

    // Fetch all user-related data in parallel
    const [user, userDocument, preferences, analytics, favorites] = await Promise.all([
      getUserById(session.user.id),
      User.findById(session.user.id).select('createdAt').lean(),
      UserPreferences.findOne({ userId: session.user.id }).lean(),
      UserAnalytics.findOne({ userId: session.user.id }).lean(),
      UserFavorite.find({ userId: session.user.id }).lean(),
    ]);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Type-safe data extraction with null checks
    const analyticsData = analytics as any;
    const preferencesData = preferences as any;
    const userDoc = userDocument as any;

    // Calculate profile completion percentage
    const getProfileCompletion = () => {
      let completed = 0;
      const total = 6;
      
      if (user.name) completed++;
      if (user.email) completed++;
      if (user.image) completed++;
      if (preferencesData?.location?.country) completed++;
      if (preferencesData?.location?.city) completed++;
      if (preferencesData?.ui?.theme) completed++;
      
      return Math.round((completed / total) * 100);
    };

    // Calculate activity level
    const getActivityLevel = () => {
      const sessions = analyticsData?.activity?.totalSessions || 0;
      const pageViews = analyticsData?.activity?.pageViews || 0;
      const searches = analyticsData?.activity?.searchQueries || 0;
      
      const totalActivity = sessions + Math.floor(pageViews / 10) + searches;
      
      if (totalActivity >= 100) return 'High';
      if (totalActivity >= 50) return 'Medium';
      if (totalActivity >= 10) return 'Low';
      return 'New';
    };

    // Calculate achievements
    const getAchievements = () => {
      const achievements = [];
      const favoritesCount = favorites.length;
      const sessions = analyticsData?.activity?.totalSessions || 0;
      const pageViews = analyticsData?.activity?.pageViews || 0;
      
      if (favoritesCount >= 10) achievements.push({ name: 'Collector', description: 'Saved 10+ listings' });
      if (sessions >= 20) achievements.push({ name: 'Regular', description: '20+ sessions' });
      if (pageViews >= 100) achievements.push({ name: 'Explorer', description: '100+ page views' });
      if (getProfileCompletion() === 100) achievements.push({ name: 'Complete', description: 'Complete profile' });
      
      return achievements;
    };

    // Get personalized recommendations based on user behavior
    const getRecommendations = () => {
      const recommendations = [];
      
      if (favorites.length === 0) {
        recommendations.push('Start by saving your first listing to create a personalized experience');
      }
      
      if (!preferencesData?.location?.country) {
        recommendations.push('Set your location preferences to get more relevant results');
      }
      
      if ((analyticsData?.activity?.searchQueries || 0) < 5) {
        recommendations.push('Try using our search filters to discover hidden gems');
      }
      
      if (getProfileCompletion() < 80) {
        recommendations.push('Complete your profile to unlock personalized features');
      }
      
      return recommendations.slice(0, 3); // Return top 3 recommendations
    };

    // Calculate monthly trends (simplified for demo)
    const getMonthlyTrends = () => {
      const currentMonth = new Date().getMonth();
      const trends = [];
      
      for (let i = 5; i >= 0; i--) {
        const month = (currentMonth - i + 12) % 12;
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        trends.push({
          month: monthNames[month],
          sessions: Math.max(0, (analyticsData?.activity?.totalSessions || 0) - (i * 2)),
          pageViews: Math.max(0, (analyticsData?.activity?.pageViews || 0) - (i * 10)),
          searches: Math.max(0, (analyticsData?.activity?.searchQueries || 0) - i),
        });
      }
      
      return trends;
    };

    // Build comprehensive dashboard data
    const dashboardData = {
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        memberSince: userDoc?.createdAt,
        completionPercentage: getProfileCompletion(),
      },
      
      activity: {
        level: getActivityLevel(),
        totalFavorites: favorites.length,
        recentFavorites: favorites
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
          .map((fav: any) => ({
            id: fav._id,
            listingId: fav.listingId,
            createdAt: fav.createdAt,
          })),
        
        analytics: analyticsData?.activity ? {
          totalSessions: analyticsData.activity.totalSessions || 0,
          averageSessionDuration: Math.round(analyticsData.activity.averageSessionDuration || 0),
          pageViews: analyticsData.activity.pageViews || 0,
          searchQueries: analyticsData.activity.searchQueries || 0,
          reviewsSubmitted: analyticsData.activity.reviewsSubmitted || 0,
          lastLogin: analyticsData.activity.lastLogin,
        } : {
          totalSessions: 0,
          averageSessionDuration: 0,
          pageViews: 0,
          searchQueries: 0,
          reviewsSubmitted: 0,
          lastLogin: null,
        },

        engagement: analyticsData?.engagement ? {
          mostViewedCategories: (analyticsData.engagement.mostViewedCategories || []).slice(0, 5),
          preferredCities: (analyticsData.engagement.preferredCities || []).slice(0, 5),
          recentSearches: (analyticsData.engagement.searchPatterns || [])
            .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10)
            .map((search: any) => ({
              query: search.query,
              timestamp: search.timestamp,
            })),
          recentViews: (analyticsData.engagement.viewHistory || [])
            .sort((a: any, b: any) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime())
            .slice(0, 10)
            .map((view: any) => ({
              listingId: view.listingId,
              viewedAt: view.viewedAt,
            })),
        } : {
          mostViewedCategories: [],
          preferredCities: [],
          recentSearches: [],
          recentViews: [],
        },

        conversions: analyticsData?.conversions ? {
          clickedExternalLinks: analyticsData.conversions.clickedExternalLinks || 0,
          completedContactForms: analyticsData.conversions.completedContactForms || 0,
          premiumListingsViewed: analyticsData.conversions.premiumListingsViewed || 0,
          mapInteractions: analyticsData.conversions.mapInteractions || 0,
        } : {
          clickedExternalLinks: 0,
          completedContactForms: 0,
          premiumListingsViewed: 0,
          mapInteractions: 0,
        },
      },

      preferences: preferencesData ? {
        location: preferencesData.location || {},
        notifications: preferencesData.notifications || {},
        ui: preferencesData.ui || {},
        filters: preferencesData.filters || {},
        privacy: preferencesData.privacy || {},
      } : null,

      insights: {
        achievements: getAchievements(),
        recommendations: getRecommendations(),
        monthlyTrends: getMonthlyTrends(),
      },
    };

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
