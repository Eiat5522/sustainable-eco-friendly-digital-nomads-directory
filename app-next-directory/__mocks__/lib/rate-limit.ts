import { jest } from '@jest/globals';

export const getClientIp = jest.fn();
export const isRateLimited = jest.fn();
export const getRetryAfterMs = jest.fn();

// Setup default returns
getClientIp.mockReturnValue('127.0.0.1');
isRateLimited.mockReturnValue(false);
getRetryAfterMs.mockReturnValue(60000);