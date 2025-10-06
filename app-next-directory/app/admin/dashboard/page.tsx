import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import type { Metadata } from 'next';
import type { UserRole } from '@/types/auth';
import {
  fetchAdminAnalytics,
  type AdminAnalyticsSnapshot,
} from '@/lib/admin/analytics';
import { ModerationActions } from './ModerationActions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  robots: { index: false, follow: false },
};

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

type AnalyticsCardProps = {
  title: string;
  value: string;
  change?: string;
};

function AnalyticsCard({ title, value, change }: AnalyticsCardProps) {
  return (
    <article className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mb-1" data-testid="analytics-card-value">
        {value}
      </p>
      {change && (
        <p
          className={`text-sm ${
            change.startsWith('+')
              ? 'text-green-600'
              : change.startsWith('-')
                ? 'text-red-600'
                : 'text-gray-600'
          }`}
        >
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
    restricted: 'bg-rose-50 text-rose-700 border-rose-200',
    flagged: 'bg-red-50 text-red-700 border-red-200',
    resolved: 'bg-sky-50 text-sky-700 border-sky-200',
  } as const;

  const readableStatus = status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const fallbackClasses = 'bg-gray-50 text-gray-700 border-gray-200';

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={`Moderation status: ${readableStatus}`}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        statusClasses[status as keyof typeof statusClasses] ?? fallbackClasses
      }`}
    >
      {readableStatus}
    </span>
  );
}

async function loadAnalytics(): Promise<AdminAnalyticsSnapshot | null> {
  try {
    const analytics = await fetchAdminAnalytics();
    return analytics;
  } catch (error) {
    console.error('Failed to fetch admin analytics:', error);
    return null;
  }
}

function ensureAdminRole(role: UserRole | undefined): role is 'admin' | 'superAdmin' {
  return role === 'admin' || role === 'superAdmin';
}

export default async function AdminDashboardPage() {
  const session = await auth();
  const sessionUser = session?.user as { id?: string; role?: UserRole } | undefined;

  if (!ensureAdminRole(sessionUser?.role)) {
    redirect('/auth/login?callbackUrl=/admin/dashboard');
  }

  const analytics = await loadAnalytics();

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="admin-dashboard-title">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-gray-600">Monitor community health and moderate member activity.</p>
          <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
            <span>Last refresh: {formatTimeAgo(analytics.generatedAt)}</span>
            <span data-testid="pending-tasks">
              {analytics.overview.pendingModeration}{' '}
              {analytics.overview.pendingModeration === 1 ? 'task assigned' : 'tasks assigned'}
            </span>
            <span>SLA: 8h</span>
          </div>
        </div>

        <section className="mb-8" data-testid="analytics-overview">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnalyticsCard title="Active members" value={formatNumber(analytics.overview.totalUsers)} />
            <AnalyticsCard title="Total listings" value={formatNumber(analytics.overview.totalListings)} />
            <AnalyticsCard title="Weekly signups" value={formatNumber(analytics.overview.weeklySignups)} />
            <AnalyticsCard title="Items pending review" value={formatNumber(analytics.overview.pendingModeration)} />
          </div>
        </section>

        <section data-testid="moderation-tools">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Moderation Queue</h2>
            <p className="text-sm text-gray-500" data-testid="queue-summary">
              {analytics.moderationQueue.length === 0
                ? 'Queue is clear — great job!'
                : `${analytics.moderationQueue.length} item${
                    analytics.moderationQueue.length > 1 ? 's' : ''
                  } awaiting review`}
            </p>
          </div>
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
                      <tr key={item.id} data-testid={`moderation-row-${item.id}`}>
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
                          <ModerationActions moderationId={item.id} itemName={item.itemName} />
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
