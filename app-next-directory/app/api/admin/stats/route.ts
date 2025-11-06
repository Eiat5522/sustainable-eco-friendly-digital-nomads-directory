import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import type { UserRole } from '@/types/auth';
import { fetchAdminAnalytics } from '@/lib/admin/analytics';
import { structuredLogger } from '@/lib/logger';

type RouteContext = { params: Promise<Record<string, never>> };

function ensureAdmin(sessionUser: { role?: UserRole } | undefined): boolean {
  const role = sessionUser?.role;
  return role === 'admin' || role === 'superAdmin';
}

export async function GET(_request: NextRequest, _context: RouteContext) {
  try {
    const session = await auth();
    const sessionUser = session?.user as { role?: UserRole } | undefined;

    if (!ensureAdmin(sessionUser)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const analytics = await fetchAdminAnalytics();
    
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
    structuredLogger.error('Admin stats error', error, {
      route: '/api/admin/stats',
      method: 'GET',
    });
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}

export async function POST(_request: NextRequest, _context: RouteContext) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}