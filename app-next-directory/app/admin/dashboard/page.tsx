import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import type { Metadata } from 'next';
import type { UserRole } from '@/types/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  robots: { index: false, follow: false },
};

type AdminAnalytics = {
  overview: {
    totalUsers: number;
    totalListings: number;
    totalReviews: number;
    weeklySignups: number;
    pendingModeration: number;
  };
  userRoles: Record<string, number>;
  moderationQueue: Array<{
    id: string;
    itemType: string;
    itemName: string;
    itemId: string;
    reports: number;
    lastActivity: string;
    status: string;
  }>;
  generatedAt: string;
};

async function getAdminAnalytics(): Promise<AdminAnalytics | null> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/analytics`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data?.analytics ?? null;
  } catch (error) {
    console.error('Failed to fetch admin analytics:', error);
    return null;
  }
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Unknown';
  }
  
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours <= 0) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

function AnalyticsCard({ title, value, change }: { title: string; value: string; change?: string }) {
  return (
    <article className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      {change && (
        <p className={`text-sm ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
          {change}
        </p>
      )}
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusClasses = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    flagged: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export default async function AdminDashboardPage() {
  const session = await auth();
  const sessionUser = session?.user as { role?: UserRole } | undefined;

  if (!sessionUser?.role || sessionUser.role !== 'admin') {
    redirect('/auth/login?callbackUrl=/admin/dashboard');
  }

  const analytics = await getAdminAnalytics();

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-8 bg-white shadow-md rounded-lg text-center">
          <h1 className="text-2xl font-semibold text-gray-800 mb-4">Admin Dashboard</h1>
          <p className="text-gray-600">Unable to load dashboard data. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50" data-testid="admin-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="admin-dashboard-title">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Monitor community health and moderate member activity.
          </p>
          <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
            <span>Last refresh: {formatTimeAgo(analytics.generatedAt)}</span>
            <span>{analytics.overview.pendingModeration} tasks assigned</span>
            <span>SLA: 8h</span>
          </div>
        </div>

        {/* Analytics Overview */}
        <section className="mb-8" data-testid="analytics-overview">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnalyticsCard
              title="Active members"
              value={formatNumber(analytics.overview.totalUsers)}
            />
            <AnalyticsCard
              title="Total listings"
              value={formatNumber(analytics.overview.totalListings)}
            />
            <AnalyticsCard
              title="Weekly signups"
              value={formatNumber(analytics.overview.weeklySignups)}
            />
            <AnalyticsCard
              title="Items pending review"
              value={formatNumber(analytics.overview.pendingModeration)}
            />
          </div>
        </section>

        {/* Moderation Queue */}
        <section data-testid="moderation-tools">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Moderation Queue</h2>
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reports
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.moderationQueue.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                        No items pending moderation
                      </td>
                    </tr>
                  ) : (
                    analytics.moderationQueue.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                          <div className="text-sm text-gray-500">{item.itemId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {item.itemType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.reports}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatTimeAgo(item.lastActivity)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button className="text-indigo-600 hover:text-indigo-900">Notes</button>
                          <button className="text-green-600 hover:text-green-900">Approve</button>
                          <button className="text-red-600 hover:text-red-900">Restrict</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}