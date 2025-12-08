import { type NextRequest, NextResponse } from 'next/server';
import { fetchAdminAnalytics } from '@/lib/admin/analytics';
import { auth } from '@/lib/auth';
import { getDefaultTimeout, RequestTimeoutError, withRequestTimeout } from '@/lib/http/request';
import { structuredLogger } from '@/lib/logger';
import type { UserRole } from '@/types/auth';

type RouteContext = { params: Promise<Record<string, never>> };

function ensureAdmin(sessionUser: { role?: UserRole } | undefined): string | null {
  const role = sessionUser?.role;
  if (!role) return null;
  if (role === 'admin' || role === 'superAdmin') {
    return role;
  }
  return null;
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
      'Fetching admin analytics timed out'
    );
    return NextResponse.json({ analytics });
  } catch (error) {
    const isTimeout = error instanceof RequestTimeoutError;
    structuredLogger.error('Admin analytics error', error, {
      route: '/api/admin/analytics',
      method: 'GET',
      errorType: error instanceof Error ? error.name : 'UnknownError',
    });
    if (isTimeout) {
      return NextResponse.json({ error: 'Analytics request timed out' }, { status: 504 });
    }
    return NextResponse.json({ error: 'Failed to fetch admin analytics' }, { status: 500 });
  }
}

export async function POST(_request: NextRequest, _context: RouteContext) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
