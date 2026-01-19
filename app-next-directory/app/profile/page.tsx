import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import {
  getOwnerReviewsForProfile,
  getUserDashboardForProfile,
} from '@/lib/data-access/profile.dal';
import { structuredLogger } from '@/lib/logger';
import type { UserRole } from '@/types/auth';
import type { UserDashboardPayloadDTO } from '@/types/dto';
import ProfileLoading from './loading';
import { ProfileClient } from './ProfileClient';

type SessionUser = {
  id: string;
  role?: UserRole;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type DashboardResult = {
  dashboard: UserDashboardPayloadDTO | null;
  error: string | null;
};

type ReviewsResult = {
  reviews: Awaited<ReturnType<typeof getOwnerReviewsForProfile>>;
  error: string | null;
};

async function loadDashboard(user: SessionUser): Promise<DashboardResult> {
  if (!user.id) {
    return { dashboard: null, error: null };
  }

  try {
    const dashboard = await getUserDashboardForProfile(
      {
        id: user.id,
        role: user.role ?? 'user',
        name: user.name ?? null,
        email: user.email ?? null,
      },
      3
    );

    if (!dashboard) {
      return {
        dashboard: null,
        error: 'Your dashboard data is not available yet. Please check back soon.',
      };
    }

    return { dashboard, error: null };
  } catch (error) {
    structuredLogger.error('Profile dashboard fetch failed', error, { component: 'profile' });
    return {
      dashboard: null,
      error: 'We could not load your activity insights. Please try again later.',
    };
  }
}

async function loadOwnerReviews(user: SessionUser): Promise<ReviewsResult> {
  if (!user.id || !user.role) {
    return { reviews: [], error: null };
  }

  try {
    const reviews = await getOwnerReviewsForProfile(user.id, user.role);
    return { reviews, error: null };
  } catch (error) {
    structuredLogger.error('Profile owner reviews fetch failed', error, { component: 'profile' });
    return {
      reviews: [],
      error: 'We could not load reviews for your listings. Please try again later.',
    };
  }
}

export async function ProfileContent() {
  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;
  const isAuthenticated = Boolean(sessionUser?.id);

  if (!isAuthenticated) {
    return (
      <ProfileClient
        sessionUser={null}
        isAuthenticated={false}
        dashboard={null}
        dashboardError={null}
        ownerReviews={[]}
        ownerError={null}
      />
    );
  }

  // sessionUser is guaranteed to exist since isAuthenticated is true
  const user = sessionUser!;
  const [dashboardResult, reviewsResult] = await Promise.all([
    loadDashboard(user),
    loadOwnerReviews(user),
  ]);

  return (
    <ProfileClient
      sessionUser={{
        id: sessionUser?.id ?? '',
        role: sessionUser?.role ?? 'user',
        name: sessionUser?.name ?? null,
        email: sessionUser?.email ?? null,
        image: sessionUser?.image ?? null,
      }}
      isAuthenticated
      dashboard={dashboardResult.dashboard}
      dashboardError={dashboardResult.error}
      ownerReviews={reviewsResult.reviews}
      ownerError={reviewsResult.error}
    />
  );
}

export default async function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileContent />
    </Suspense>
  );
}
