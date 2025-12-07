import { type NextRequest, NextResponse } from 'next/server';
import { fetchAdminAnalytics } from '@/lib/admin/analytics';
import { auth } from '@/lib/auth';
import { getDefaultTimeout, RequestTimeoutError, withRequestTimeout } from '@/lib/http/request';
import { structuredLogger } from '@/lib/logger';
import type { UserRole } from '@/types/auth';

type RouteContext = { params: Promise<Record<string, never>> };

function ensureAdmin(sessionUser: { role?: UserRole } | undefined): boolean {
  const role = sessionUser?.role;
  return role === 'admin' || role === 'superAdmin';
}

export async function GET(request: NextRequest, _context: RouteContext) {
  try {
    // Pass request headers to auth() to avoid implicit headers() calls
    const session = await auth(request.headers);
    const sessionUser = session?.user as { role?: UserRole } | undefined;

    if (!ensureAdmin(sessionUser)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const analytics = await withRequestTimeout(
      fetchAdminAnalytics(),
      getDefaultTimeout(),
      'Fetching admin statistics timed out'
    );

    // Transform to match the expected stats API format
    const stats = {
      totalUsers: analytics.overview.totalUsers,
      totalListings: analytics.overview.totalListings,
      totalReviews: analytics.overview.totalReviews,
      weeklySignups: analytics.overview.weeklySignups,
      pendingModeration: analytics.overview.pendingModeration,
      userRoles: analytics.userRoles,
      generatedAt: analytics.generatedAt,
    };

    return NextResponse.json(stats);
  } catch (error) {
    const isTimeout = error instanceof RequestTimeoutError;
    structuredLogger.error('Admin stats error', error, {
      route: '/api/admin/stats',
      method: 'GET',
      errorType: error instanceof Error ? error.name : 'UnknownError',
    });
    if (isTimeout) {
      return NextResponse.json({ error: 'Admin stats request timed out' }, { status: 504 });
    }
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}

export async function POST(_request: NextRequest, _context: RouteContext) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
