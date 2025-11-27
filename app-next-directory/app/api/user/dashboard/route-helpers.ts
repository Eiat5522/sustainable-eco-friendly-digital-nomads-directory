import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth'; // Import auth directly
import { getUserDashboardData } from '@/lib/dashboard/user-dashboard'; // Import getUserDashboardData directly
import { structuredLogger } from '@/lib/logger';
import type { UserRole } from '@/types/auth';

const DEFAULT_MONTH_WINDOW = 3;
const MAX_MONTH_WINDOW = 12;

export function normalizeMonthWindow(monthsParam: string | null): number {
  if (!monthsParam) return DEFAULT_MONTH_WINDOW;
  const parsed = Number.parseInt(monthsParam, 10);
  if (Number.isNaN(parsed)) return DEFAULT_MONTH_WINDOW;
  return Math.min(Math.max(parsed, 1), MAX_MONTH_WINDOW);
}

export function createDashboardHandler({ logger }: Pick<typeof structuredLogger, 'error'>) {
  // Modify function signature
  return async function GET(request: NextRequest) {
    try {
      const session = await auth(); // Use imported auth directly
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
      const months = normalizeMonthWindow(searchParams.get('months'));

      const dashboard = await getUserDashboardData(
        // Use imported getUserDashboardData directly
        {
          id: sessionUser.id,
          role: sessionUser.role ?? 'user',
          name: sessionUser.name ?? null,
          email: sessionUser.email ?? null,
        },
        { months }
      );

      if (!dashboard) {
        return NextResponse.json({ error: 'Dashboard unavailable' }, { status: 404 });
      }

      return NextResponse.json({ dashboard });
    } catch (error) {
      const logMessage = '[user-dashboard] GET failed';
      if (logger?.error) {
        logger.error(logMessage, error, {
          route: '/api/user/dashboard',
        });
      } else {
        structuredLogger.error(logMessage, error, {
          route: '/api/user/dashboard',
        });
      }
      return NextResponse.json({ error: 'Unable to load dashboard data' }, { status: 500 });
    }
  };
}
