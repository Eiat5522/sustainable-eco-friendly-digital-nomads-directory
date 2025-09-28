import jestGlobals from '@jest/globals';

const { jest } = jestGlobals;

export const structuredLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  emailError: jest.fn(),
  child: jest.fn(),
};

structuredLogger.child.mockImplementation(() => structuredLogger);

export const getRequestContext = jest.fn(() => ({
  ip: '127.0.0.1',
  method: 'POST',
  url: '/api/auth/register',
  userAgent: 'jest',
}));

export default {
  structuredLogger,
  getRequestContext,
};
