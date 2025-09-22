import { jest } from '@jest/globals';

export const structuredLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  fatal: jest.fn(),
  child: jest.fn(() => structuredLogger),
};

export const getRequestContext = jest.fn();

// Setup default returns
getRequestContext.mockReturnValue({
  ip: '127.0.0.1',
  userAgent: 'test-user-agent',
  method: 'POST',
  url: '/api/test',
});

export default structuredLogger;