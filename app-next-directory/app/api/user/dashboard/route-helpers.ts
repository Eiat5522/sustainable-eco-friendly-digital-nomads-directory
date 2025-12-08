import { type NextRequest, NextResponse } from 'next/server';
import type { auth } from '@/lib/auth';
import type { getUserDashboardData } from '@/lib/dashboard/user-dashboard';
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

type DashboardDependencies = {
  authFn: typeof auth;
  fetchDashboard: typeof getUserDashboardData;
  logger?: Pick<typeof structuredLogger, 'error'>;
};

export function createDashboardHandler({ authFn, fetchDashboard, logger }: DashboardDependencies) {
  return async function GET(request: NextRequest) {
    try {
      // FORTEST: guard for prerender - handle headers() unavailability
      let session: Awaited<ReturnType<typeof authFn>> | null = null;
      try {
        session = await authFn();
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes('headers()') || msg.includes('During prerendering')) {
          if (logger?.error) {
            logger.error('[user-dashboard] headers() unavailable during prerender', error, {
              route: '/api/user/dashboard',
            });
          } else {
            structuredLogger.warn(
              '[user-dashboard] headers() unavailable during prerender',
              error,
              {
                route: '/api/user/dashboard',
              }
            );
          }
          return new Response(null, { status: 204 });
        }
        throw error;
      }

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

      const dashboard = await fetchDashboard(
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
