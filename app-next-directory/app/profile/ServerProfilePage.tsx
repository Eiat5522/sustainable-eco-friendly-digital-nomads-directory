'use cache';

import { Suspense } from 'react';
import { cacheLife, cacheTag, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ClientProfilePage } from './ClientProfilePage';
import { getUserDashboard, getUserReviews } from '@/lib/data/user';
import type { UserDashboardPayloadDTO, UserRole } from '@/types/dto';

interface ServerProfilePageProps {
  userId: string;
  userRole: UserRole;
  userName: string;
  userEmail?: string;
  userImage?: string;
}

// User-specific cached function with security keying
async function getUserStats(userId: string) {
  "use cache";
  cacheLife({ stale: 300, expire: 900 });
  cacheTag(`user-stats-${userId}`);
  
  const dashboard = await getUserDashboard(userId, 3);
  const reviews = await getUserReviews(userId);
  
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

export default async function ServerProfilePage({ 
  userId, 
  userRole, 
  userName, 
  userEmail, 
  userImage 
}: ServerProfilePageProps) {
  // Perform auth check first, then move heavy data queries into cached function
  if (!userId) {
    redirect('/auth/login');
  }

  // Key the cache specifically to this user to prevent data leaking
  const userStats = await getUserStats(userId);

  return (
    <>
      <Header />
      <main className="container mx-auto space-y-12 px-4 py-12">
        <ClientProfilePage
          userId={userId}
          userRole={userRole}
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
          userStats={userStats}
        />
      </main>
      <Footer />
    </>
  );
}
