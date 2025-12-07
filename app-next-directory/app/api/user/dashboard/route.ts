// MIGRATED: Removed `export const dynamic` (incompatible with cacheComponents).

import { auth } from '@/lib/auth';
import { getUserDashboardData } from '@/lib/dashboard/user-dashboard';
import { structuredLogger } from '@/lib/logger';
import { createDashboardHandler } from './route-helpers';

export const GET = createDashboardHandler({
  authFn: auth,
  fetchDashboard: getUserDashboardData,
  logger: structuredLogger,
});
