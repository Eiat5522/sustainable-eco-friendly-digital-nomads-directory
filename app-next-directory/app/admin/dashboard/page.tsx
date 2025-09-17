import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import DashboardStats from '@/components/admin/DashboardStats';
import RecentActivity from '@/components/admin/RecentActivity';
import QuickActions from '@/components/admin/QuickActions';
import AnalyticsChart from '@/components/admin/AnalyticsChart';

export default async function AdminDashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to the Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Manage your platform, monitor activity, and oversee content moderation.
        </p>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Dashboard Stats */}
      <Suspense fallback={<div className="h-32 bg-gray-100 rounded-lg animate-pulse" />}>
        <DashboardStats />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Analytics Chart */}
        <Suspense fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse" />}>
          <AnalyticsChart />
        </Suspense>

        {/* Recent Activity */}
        <Suspense fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse" />}>
          <RecentActivity />
        </Suspense>
      </div>
    </div>
  );
}