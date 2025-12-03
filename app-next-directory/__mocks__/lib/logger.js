import { jest } from '@jest/globals';

const callConsole = (level, args) => {
  const forwarded =
    args.length >= 2 && (args[1] instanceof Error || typeof args[1] === 'string')
      ? args.slice(0, 2)
      : [args[0]];
  const fn = console[level] || console.log;
  if (typeof fn === 'function') {
    try {
      fn(...forwarded);
    } catch {
      /* ignore */
    }
  }
};

export const structuredLogger = {
  info: jest.fn((...args) => {
    callConsole('log', args);
  }),
  warn: jest.fn((...args) => {
    callConsole('warn', args);
  }),
  error: jest.fn((...args) => {
    callConsole('error', args);
  }),
  middlewareError: jest.fn(),
  debug: jest.fn((...args) => {
    callConsole('debug', args);
  }),
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

export const redirectConsoleToStructuredLogger = jest.fn();
export const logError = jest.fn((message, error, context) =>
  structuredLogger.error(message, error, context)
);

const loggerMock = {
  structuredLogger,
  getRequestContext,
  redirectConsoleToStructuredLogger,
  logError,
};

export default loggerMock;
