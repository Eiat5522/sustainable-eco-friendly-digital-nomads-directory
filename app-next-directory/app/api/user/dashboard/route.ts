// MIGRATED: Removed export const dynamic = 'force-dynamic' (incompatible with Cache Components)

import { structuredLogger } from '@/lib/logger';
import { createDashboardHandler } from './route-helpers';

export const GET = createDashboardHandler({
  logger: structuredLogger,
});
