import { jest } from '@jest/globals';

// Mock implementation that doesn't use console directly
// Provides testable mock functions that can be asserted upon

// Store all logged messages for testing
const loggedMessages = [];

export const structuredLogger = {
  info: jest.fn((...args) => {
    loggedMessages.push({ level: 'info', args });
  }),
  warn: jest.fn((...args) => {
    loggedMessages.push({ level: 'warn', args });
  }),
  error: jest.fn((...args) => {
    loggedMessages.push({ level: 'error', args });
  }),
  middlewareError: jest.fn(),
  debug: jest.fn((...args) => {
    loggedMessages.push({ level: 'debug', args });
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

// Helper for tests to check logged messages
export const getLoggedMessages = () => [...loggedMessages];
export const clearLoggedMessages = () => {
  loggedMessages.length = 0;
};

const loggerMock = {
  structuredLogger,
  getRequestContext,
  redirectConsoleToStructuredLogger,
  logError,
  getLoggedMessages,
  clearLoggedMessages,
};

export default loggerMock;
