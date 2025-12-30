'use cache';

import { cacheLife, cacheTag, updateTag } from 'next/cache';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { getUserDashboardData } from '@/lib/dashboard/user-dashboard';
import type { UserRole } from '@/types/auth';
import type { UserDashboardPayloadDTO } from '@/types/dto';

interface ServerProfilePageProps {
  userId: string;
  userRole: UserRole;
  userName: string;
  userEmail?: string;
  userImage?: string;
}

// User-specific cached function with security keying
async function getUserStats(
  userId: string,
  userRole: UserRole,
  userName: string,
  userEmail?: string
) {
  'use cache';
  cacheLife({ stale: 300, expire: 900 });
  cacheTag(`user-stats-${userId}`);

  const dashboard = await getUserDashboardData({
    id: userId,
    role: userRole,
    name: userName,
    email: userEmail,
  });
  const reviews: unknown[] = []; // Mocked for now as getUserReviews is missing

  return {
    dashboard,
    reviews,
    generatedAt: new Date().toISOString(),
  };
}

// Helper function to refresh user stats (call this after user actions)
export async function refreshUserStats(userId: string) {
  updateTag(`user-stats-${userId}`);
}

type ProfileStats = {
  totalReviews: number;
  averageRating: number | null;
  activeListings: number;
};

const getProfileStats = (dashboard: UserDashboardPayloadDTO | null): ProfileStats => {
  if (!dashboard) {
    return { totalReviews: 0, averageRating: null, activeListings: 0 };
  }

  if (dashboard.data.kind === 'venueOwner') {
    return {
      totalReviews: dashboard.data.totals.reviewCount,
      averageRating: dashboard.data.totals.avgRating,
      activeListings: dashboard.data.listings.length,
    };
  }

  return {
    totalReviews: dashboard.data.metrics.reviewsWritten,
    averageRating: dashboard.data.metrics.avgRatingGiven,
    activeListings: 0,
  };
};

export default async function ServerProfilePage({
  userId,
  userRole,
  userName,
  userEmail,
  userImage,
}: ServerProfilePageProps) {
  // Perform auth check first, then move heavy data queries into cached function
  if (!userId) {
    redirect('/auth/login');
  }

  // Key the cache specifically to this user to prevent data leaking
  const userStats = await getUserStats(userId, userRole, userName, userEmail);
  const stats = getProfileStats(userStats.dashboard);

  return (
    <>
      <Header />
      <main className="container mx-auto space-y-12 px-4 py-12">
        <div className="rounded-lg border p-6 shadow-sm">
          <div className="flex items-center space-x-4">
            {userImage && (
              <Image
                src={userImage}
                alt={userName}
                width={64}
                height={64}
                className="h-16 w-16 rounded-full"
                unoptimized
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">{userName}</h1>
              <p className="text-gray-500">{userEmail}</p>
              <span className="inline-block rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                {userRole}
              </span>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded bg-gray-50 p-4">
              <h3 className="text-sm font-medium text-gray-500">Total Reviews</h3>
              <p className="text-2xl font-bold">{stats.totalReviews}</p>
            </div>
            <div className="rounded bg-gray-50 p-4">
              <h3 className="text-sm font-medium text-gray-500">Average Rating</h3>
              <p className="text-2xl font-bold">
                {stats.averageRating !== null ? stats.averageRating.toFixed(1) : '—'}
              </p>
            </div>
            <div className="rounded bg-gray-50 p-4">
              <h3 className="text-sm font-medium text-gray-500">Active Listings</h3>
              <p className="text-2xl font-bold">{stats.activeListings}</p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
            <p className="mt-2 text-gray-600">
              Generated at: {new Date(userStats.generatedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
