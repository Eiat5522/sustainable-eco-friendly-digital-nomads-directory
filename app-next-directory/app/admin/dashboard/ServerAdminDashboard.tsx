'use cache';

import { cacheLife, cacheTag, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { fetchAdminAnalytics, fetchModerationQueue } from '@/lib/admin/analytics';
import { auth } from '@/lib/auth';
import AdminLayout from '../layout';
import AdminDashboardClient from './AdminDashboardClient';

// Global cache for shared analytics data among all admins
async function getAdminAnalyticsData() {
  'use cache';
  cacheLife({ stale: 300, revalidate: 600 }); // 5-minute stale window
  cacheTag('admin-analytics');

  const analytics = await fetchAdminAnalytics();
  const moderationQueue = await fetchModerationQueue();

  return {
    analytics,
    moderationQueue,
    generatedAt: new Date().toISOString(),
  };
}

// Helper function to refresh admin analytics (call after admin actions)
export async function refreshAdminAnalytics() {
  updateTag('admin-analytics');
}

// Helper function to refresh moderation queue (call after approval/rejection)
export async function refreshModerationQueue() {
  updateTag('moderation');
}

export default async function ServerAdminDashboard() {
  const session = await auth();

  // Role check before invoking cached function
  const user = session?.user;
  const isAdmin = user?.role === 'admin' || user?.role === 'superAdmin';

  if (!isAdmin) {
    redirect('/403');
  }

  // Use global cache shared among all admins
  const adminData = await getAdminAnalyticsData();

  return (
    <AdminLayout>
      <Suspense
        fallback={
          <div className="flex items-center gap-3 text-sm text-neo-text-secondary" role="status">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-neo-primary border-t-transparent" />
            Loading admin analytics…
          </div>
        }
      >
        <AdminDashboardClient adminData={adminData} />
      </Suspense>
    </AdminLayout>
  );
}
