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
  handlers,
  sanityHandlers,
  redisHandlers,
  apiHandlers,
  setReviewsResponse,
  setRegisterResponse,
  resetRedisStore,
  seedRedisStore,
  getRedisStoreState,
} from './handlers/index';

export { default } from './handlers/index';
