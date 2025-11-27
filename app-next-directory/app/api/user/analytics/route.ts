import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { getUserDashboardData } from '@/lib/dashboard/user-dashboard';
import { structuredLogger } from '@/lib/logger';
import type { UserRole } from '@/types/auth';
import type { UserAnalyticsPayloadDTO, UserAnalyticsSummaryDTO } from '@/types/dto';

const DEFAULT_MONTH_WINDOW = 3;
const MAX_MONTH_WINDOW = 12;

function normaliseMonthWindow(monthsParam: string | null): number {
  if (!monthsParam) return DEFAULT_MONTH_WINDOW;
  const parsed = Number.parseInt(monthsParam, 10);
  if (Number.isNaN(parsed)) return DEFAULT_MONTH_WINDOW;
  return Math.min(Math.max(parsed, 1), MAX_MONTH_WINDOW);
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const sessionUser = session?.user as
      | {
          id?: string;
          role?: UserRole;
          name?: string | null;
          email?: string | null;
        }
      | undefined;

    if (!sessionUser?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const months = normaliseMonthWindow(searchParams.get('months'));

    const dashboard = await getUserDashboardData(
      {
        id: sessionUser.id,
        role: sessionUser.role ?? 'user',
        name: sessionUser.name ?? null,
        email: sessionUser.email ?? null,
      },
      { months }
    );

    if (!dashboard) {
      return NextResponse.json({ error: 'Analytics unavailable' }, { status: 404 });
    }

    let analyticsData: UserAnalyticsPayloadDTO['data'];

    if (dashboard.data.kind === 'venueOwner') {
      const summary: UserAnalyticsSummaryDTO = {
        avgRating: dashboard.data.totals.avgRating,
        reviewCount: dashboard.data.totals.reviewCount,
        favoritesCount: dashboard.data.totals.favoritesCount,
        viewCount: dashboard.data.totals.viewCount,
      };

      analyticsData = {
        kind: 'venueOwner',
        summary,
        monthly: dashboard.data.monthlyTotals,
      };
    } else {
      analyticsData = {
        kind: 'user',
        summary: {
          avgRating: dashboard.data.metrics.avgRatingGiven,
          reviewCount: dashboard.data.metrics.reviewsWritten,
          favoritesCount: dashboard.data.metrics.favoritesCount,
        },
        monthly: dashboard.data.monthly,
      };
    }

    const analytics: UserAnalyticsPayloadDTO = {
      user: {
        id: dashboard.user.id,
        role: dashboard.user.role,
      },
      generatedAt: dashboard.generatedAt,
      range: dashboard.range,
      data: analyticsData,
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    const logMessage = '[user-analytics] GET failed';
    structuredLogger.error(logMessage, error, { route: '/api/user/analytics' });
    return NextResponse.json({ error: 'Unable to load analytics data' }, { status: 500 });
  }
}
