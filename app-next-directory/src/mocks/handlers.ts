/**
 * MSW Handlers - Main Export
 *
 * Re-exports handlers from the organized handlers/ directory structure.
 * This file maintains backward compatibility with existing imports while
 * providing a cleaner, more organized handler structure.
 *
 * @module mocks/handlers
 */

export {
  apiHandlers,
  default,
  getRedisStoreState,
  handlers,
  redisHandlers,
  resetRedisStore,
  sanityHandlers,
  seedRedisStore,
  setRegisterResponse,
  setReviewsResponse,
} from './handlers/index';
