export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@/lib/auth';
import { getUserDashboardData } from '@/lib/dashboard/user-dashboard';
import { structuredLogger } from '@/lib/logger';
import type { UserRole } from '@/types/auth';

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
    const sessionUser = session?.user as {
      id?: string;
      role?: UserRole;
      name?: string | null;
      email?: string | null;
    } | undefined;

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
      { months },
    );

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard unavailable' }, { status: 404 });
    }

    return NextResponse.json({ dashboard });
  } catch (error) {
    const logMessage = '[user-dashboard] GET failed';
    if (structuredLogger?.error) {
      structuredLogger.error(logMessage, error, {
        route: '/api/user/dashboard',
      });
    } else {
      console.error(logMessage, error);
    }
    return NextResponse.json({ error: 'Unable to load dashboard data' }, { status: 500 });
  }
}
