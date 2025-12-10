/**
 * MSW Handlers Index
 *
 * Centralizes all MSW request handlers for:
 * - Sanity CMS API
 * - Redis/Upstash API
 * - Internal Next.js API routes
 *
 * Export structure:
 * - `handlers` - Combined array of all handlers for MSW server setup
 * - Individual handler arrays for granular control in tests
 *
 * @module mocks/handlers
 */

import { apiHandlers } from './api';
import { redisHandlers } from './redis';
import { sanityHandlers } from './sanity';

/**
 * Combined array of all MSW handlers
 *
 * Order matters: Sanity handlers first to ensure they intercept
 * before any wildcard patterns in API handlers
 */
export const handlers = [...sanityHandlers, ...redisHandlers, ...apiHandlers];

/**
 * Export individual handler arrays for granular control
 */
export { sanityHandlers, redisHandlers, apiHandlers };

/**
 * Export helper functions for test-specific overrides
 */
export { setRegisterResponse, setReviewsResponse } from './api';
export { getRedisStoreState, resetRedisStore, seedRedisStore } from './redis';

/**
 * Default export for backwards compatibility
 */
export default handlers;
