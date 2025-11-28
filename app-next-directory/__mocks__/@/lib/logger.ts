import type { LogContext, RequestLike, UserRole } from '../../types/logger';

type SessionUser = { id?: string; role?: UserRole } | undefined;

const createMockLoggerMethod = () => jest.fn();

export const structuredLogger = {
  debug: createMockLoggerMethod(),
  info: createMockLoggerMethod(),
  warn: createMockLoggerMethod(),
  error: createMockLoggerMethod(),
  fatal: createMockLoggerMethod(), // Added fatal method
  apiError: createMockLoggerMethod(),
  authError: createMockLoggerMethod(),
  emailError: createMockLoggerMethod(),
  middlewareError: createMockLoggerMethod(),
  performance: createMockLoggerMethod(),
  security: createMockLoggerMethod(),
  child: createMockLoggerMethod().mockReturnValue({
    debug: createMockLoggerMethod(),
    info: createMockLoggerMethod(),
    warn: createMockLoggerMethod(),
    error: createMockLoggerMethod(),
    fatal: createMockLoggerMethod(),
  }),
};

export const internalLogger = structuredLogger; // Mock internalLogger to be the same as structuredLogger for testing purposes
export const logError = structuredLogger.error; // Mock logError to point to structuredLogger.error

// Mocked getRequestContext for consistent testing
export const getRequestContext = jest.fn(
  (req: RequestLike | undefined): LogContext => ({
    method: req?.method,
    path: req?.url ?? req?.nextUrl?.pathname,
    userAgent: 'mock-user-agent',
    ip: '127.0.0.1',
    requestId: 'mock-request-id',
  })
);

export default structuredLogger;
