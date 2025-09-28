import jestGlobals from '@jest/globals';

const { jest } = jestGlobals;

export const getClientIp = jest.fn(() => '127.0.0.1');
export const isRateLimited = jest.fn(() => false);
export const getRetryAfterMs = jest.fn(() => 60_000);

export default {
  getClientIp,
  isRateLimited,
  getRetryAfterMs,
};
