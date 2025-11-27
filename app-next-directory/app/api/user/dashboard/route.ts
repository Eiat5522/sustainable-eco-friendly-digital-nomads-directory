import { structuredLogger } from '@/lib/logger';
import { createDashboardHandler } from './route-helpers';

export const GET = createDashboardHandler({
  logger: structuredLogger,
});
