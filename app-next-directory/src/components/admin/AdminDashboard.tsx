'use client';

import { useSession } from "@auth/nextjs/react";
import { useEffect, useState } from 'react';

interface AnalyticsData {
  overview: {
    totalListings: number;
    totalUsers: number;
    totalReviews: number;
    totalBlogPosts: number;
    totalCities: number;
    totalEcoTags: number;
  };
  listings: {
    byCategory: Array<{ category: string; count: number }>;
    byCity: Array<{ city: string; count: number }>;
    byEcoRating: Array<{ rating: number; count: number }>;
    averageEcoRating: number;
  };
  users: {
    byRole: Array<{ role: string; count: number }>;
    recentSignups: number;
    activeUsers: number;
  };
  content: {
    averageRating: number;
    totalBlogViews: number;
    pendingReviews: number;
  };
  performance: {
    topListings: Array<{ name: string; views: number; rating: number }>;
    conversionRate: number;
    averageSessionDuration: number;
  };
}

interface ModerationQueueItem {
  _id: string;
  type: string;
  title: string;
  status: string;
  flagReason?: string;
  reportedAt: string;
  reportedBy?: string;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [moderationQueue, setModerationQueue] = useState<ModerationQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchAnalytics();
      fetchModerationQueue();
    }
  }, [session]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const fetchModerationQueue = async () => {
    try {
      const response = await fetch('/api/admin/moderation?status=pending&limit=5');
      if (response.ok) {
        const data = await response.json();
        setModerationQueue(data.data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch moderation queue:', error);
    }
    setLoading(false);
  };

  if (loading || !analytics) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Admin Dashboard</h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Total Users"
          value={analytics.overview.totalUsers}
          subtitle="Registered users"
          color="blue"
        />
        <StatsCard
          title="Active Listings"
          value={analytics.overview.totalListings}
          subtitle="Published listings"
          color="green"
        />
        <StatsCard
          title="Total Reviews"
          value={analytics.overview.totalReviews}
          subtitle="User reviews"
          color="purple"
        />
        <StatsCard
          title="Blog Posts"
          value={analytics.overview.totalBlogPosts}
          subtitle="Published articles"
          color="yellow"
        />
        <StatsCard
          title="Cities Covered"
          value={analytics.overview.totalCities}
          subtitle="Global destinations"
          color="indigo"
        />
        <StatsCard
          title="Eco Tags"
          value={analytics.overview.totalEcoTags}
          subtitle="Sustainability features"
          color="teal"
        />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Listings by Category */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Listings by Category</h3>
          <div className="space-y-2">
            {analytics.listings.byCategory.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-600 capitalize">{item.category}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* User Roles Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">User Roles</h3>
          <div className="space-y-2">
            {analytics.users.byRole.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-600 capitalize">{item.role}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Cities */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Top Cities</h3>
          <div className="space-y-2">
            {analytics.listings.byCity.slice(0, 5).map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-600">{item.city}</span>
                <span className="font-semibold">{item.count} listings</span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Average Eco Rating</span>
              <span className="font-semibold">{analytics.listings.averageEcoRating.toFixed(1)}/5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Conversion Rate</span>
              <span className="font-semibold">{analytics.performance.conversionRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Average Rating</span>
              <span className="font-semibold">{analytics.content.averageRating.toFixed(1)}/5</span>
            </div>
          </div>
        </div>
      </div>

      {/* Moderation Queue */}
      {moderationQueue.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Pending Moderation</h3>
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">
              {moderationQueue.length} items
            </span>
          </div>
          <div className="space-y-3">
            {moderationQueue.map((item) => (
              <div key={item._id} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <span className="font-medium">{item.title}</span>
                  <span className="ml-2 text-sm text-gray-500 capitalize">({item.type})</span>
                  {item.flagReason && (
                    <div className="text-sm text-red-600 mt-1">Reason: {item.flagReason}</div>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(item.reportedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Performing Listings */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Top Performing Listings</h3>
        <div className="space-y-3">
          {analytics.performance.topListings.map((listing, index) => (
            <div key={index} className="flex justify-between items-center p-3 border rounded">
              <div>
                <span className="font-medium">{listing.name}</span>
                <div className="text-sm text-gray-500">
                  Rating: {listing.rating.toFixed(1)}/5
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{listing.views} views</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: number;
  subtitle: string;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'indigo' | 'teal';
}

function StatsCard({ title, value, subtitle, color }: StatsCardProps) {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    yellow: 'text-yellow-600',
    indigo: 'text-indigo-600',
    teal: 'text-teal-600',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
      <h2 className="text-lg font-semibold text-gray-700 mb-2">{title}</h2>
      <p className={`text-3xl font-bold ${colorClasses[color]} mb-1`}>
        {value.toLocaleString()}
      </p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}
