import pino from 'pino';

// Environment check for safe logging configuration
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';
const isE2E = process.env.E2E === '1';

// Check if we're running in a Node.js environment (server-side)
// pino-pretty with worker threads doesn't work well in Next.js server contexts
const isServer = typeof window === 'undefined';

// Redact sensitive fields to prevent information leakage
const redactPaths = [
  'password',
  'token',
  'apiKey',
  'secret',
  'authorization',
  'cookie',
  'email', // Partially redact for privacy
  'creditCard',
  'ssn',
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  'err.config.headers.authorization',
  'error.config.headers.authorization'
];

type HeaderGetter = (name: string) => string | null | undefined;
type HeaderValue = string | string[] | undefined;
type HeaderCollection = Headers | (Record<string, HeaderValue> & { get?: HeaderGetter });

interface RequestLike {
  method?: string;
  url?: string;
  path?: string;
  nextUrl?: { pathname?: string };
  headers?: HeaderCollection;
  ip?: string;
}

interface ResponseLike {
  statusCode?: number;
  headers?: HeaderCollection;
}

interface UserLike {
  id?: string;
  role?: string;
  email?: string;
}

type LogPrimitive = string | number | boolean | null | undefined;
type LogValue = LogPrimitive | LogValue[] | { [key: string]: LogValue };

interface LogContext extends Record<string, LogValue> {
  userId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  path?: string;
  method?: string;
  component?: string;
}

type SanitizedError = Record<string, unknown> | undefined;

const toRedacted = (value: string | undefined): string | undefined =>
  value ? '[REDACTED]' : undefined;

const getHeaderValue = (headers: HeaderCollection | undefined, name: string): string | undefined => {
  if (!headers) return undefined;

  const lower = name.toLowerCase();
  const getter = (headers as { get?: HeaderGetter }).get;
  if (typeof getter === 'function') {
    const viaGetter = getter.call(headers, name) ?? getter.call(headers, lower);
    if (typeof viaGetter === 'string') {
      return viaGetter;
    }
  }

  const record = headers as Record<string, HeaderValue>;
  const direct = record[name] ?? record[lower];
  if (typeof direct === 'string') {
    return direct;
  }
  if (Array.isArray(direct)) {
    const first = direct.find((entry): entry is string => typeof entry === 'string');
    if (first) {
      return first;
    }
  }

  return undefined;
};

const shouldRedactKey = (key: string): boolean =>
  redactPaths.some(path => key.toLowerCase().includes(path.toLowerCase()));

// Create base logger configuration
const loggerConfig: pino.LoggerOptions = {
  level: isE2E ? 'silent' : isProduction ? 'info' : isDevelopment ? 'debug' : 'silent',
  
  // Redaction configuration for security
  redact: {
    paths: redactPaths,
    censor: '[REDACTED]'
  },

  // Serialization for common objects
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
    req: (req: RequestLike | undefined) => {
      const headers = req?.headers;
      const authorization = getHeaderValue(headers, 'authorization');
      const cookie = getHeaderValue(headers, 'cookie');
      const userAgent = getHeaderValue(headers, 'user-agent');

      return {
        method: req?.method,
        url: req?.url,
        path: req?.path ?? req?.nextUrl?.pathname,
        userAgent,
        headers: headers
          ? {
              authorization: toRedacted(authorization),
              cookie: toRedacted(cookie),
            }
          : undefined,
      };
    },
    res: (res: ResponseLike | undefined) => {
      const headers = res?.headers;
      return {
        statusCode: res?.statusCode,
        headers: headers
          ? {
              'set-cookie': toRedacted(getHeaderValue(headers, 'set-cookie')),
            }
          : undefined,
      };
    },
    user: (user: UserLike | undefined) => {
      const email = typeof user?.email === 'string' ? user.email : undefined;
      const maskedEmail = email && email.includes('@')
        ? `${email.substring(0, 3)}***@${email.split('@')[1] ?? ''}`
        : undefined;

      return {
        id: user?.id,
        role: user?.role,
        email: maskedEmail,
      };
    },
  },

  // Base fields for all logs
  base: {
    pid: process.pid,
    hostname: process.env.HOSTNAME || 'unknown',
    service: 'sustainable-nomads-directory',
    version: process.env.npm_package_version || '0.1.0'
  }
};

// Configure pretty printing for development
// IMPORTANT: We avoid using pino's transport mechanism with pino-pretty because it spawns
// worker threads that fail to resolve paths correctly in Next.js with custom distDir.
// Instead, we use pino-pretty as a direct stream destination without worker threads.
let logger: pino.Logger = pino(loggerConfig);

if (isDevelopment && !isE2E && isServer) {
  // In development server-side, try to hydrate pino-pretty via dynamic import.
  // We default to the base logger immediately so logging works even if the
  // pretty printer fails to load or is still resolving asynchronously.
  void (async () => {
    try {
      const pinoPrettyModule = await import('pino-pretty');
      const maybePretty =
        typeof pinoPrettyModule === 'function'
          ? (pinoPrettyModule as unknown)
          : (pinoPrettyModule as { default?: unknown }).default;
      const pinoPretty =
        ((pinoPrettyModule as any).default ?? (pinoPrettyModule as unknown)) as (typeof import('pino-pretty'))['default'];
      if (typeof pinoPretty !== 'function') {
        console.warn('Failed to initialize pino-pretty, using basic logger: module did not export a function');
        return;
      }
      const prettyStream = pinoPretty({
        colorize: true,
        translateTime: 'yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname,service,version',
        sync: true // Force synchronous mode to avoid worker threads
      });
      logger = pino(loggerConfig, prettyStream);
    } catch (error) {
      // Fallback to basic logger if pino-pretty fails to load
      console.warn('Failed to initialize pino-pretty, using basic logger:', error);
    }
  })();
}

// Enhanced logging interface with context support
// Helper function to sanitize error objects
function sanitizeError(error: unknown): SanitizedError {
  if (!error) return undefined;

  if (error instanceof Error) {
    const sanitized: Record<string, unknown> = {
      message: error.message,
      name: error.name,
      stack: isProduction ? undefined : error.stack,
    };

    const record = error as unknown as Record<string, unknown>;
    if (record.code !== undefined) {
      sanitized.code = record.code;
    }
    const status = record.status ?? record.statusCode;
    if (status !== undefined) {
      sanitized.status = status;
    }

    Object.entries(record).forEach(([key, value]) => {
      if (!shouldRedactKey(key) && value !== undefined) {
        sanitized[key] = value;
      }
    });

    return sanitized;
  }

  if (typeof error === 'object') {
    const sanitized: Record<string, unknown> = {};
    Object.entries(error as unknown as Record<string, unknown>).forEach(([key, value]) => {
      if (!shouldRedactKey(key) && value !== undefined) {
        sanitized[key] = value;
      }
    });
    return sanitized;
  }

  return { message: String(error) };
}

// Enhanced logger with structured logging methods
export const structuredLogger = {
  // Core logging methods
  debug: (msg: string, context?: LogContext) => {
    logger.debug(context, msg);
  },
  
  info: (msg: string, context?: LogContext) => {
    logger.info(context, msg);
  },
  
  warn: (msg: string, context?: LogContext) => {
    logger.warn(context, msg);
  },
  
  error: (msg: string, error?: unknown, context?: LogContext) => {
    const sanitizedError = sanitizeError(error);
    const logContext = {
      ...context,
      ...(sanitizedError ? { err: sanitizedError, error: sanitizedError } : {}),
    };
    logger.error(logContext, msg);
  },

  // Specialized logging methods for common use cases
  apiError: (endpoint: string, error: unknown, context?: Omit<LogContext, 'path'>) => {
    structuredLogger.error(`API Error in ${endpoint}`, error, {
      ...context,
      path: endpoint,
      component: 'api'
    });
  },

  authError: (action: string, error: unknown, context?: LogContext) => {
    structuredLogger.error(`Auth Error: ${action}`, error, {
      ...context,
      component: 'auth'
    });
  },

  emailError: (action: string, error: unknown, context?: LogContext) => {
    structuredLogger.error(`Email Error: ${action}`, error, {
      ...context,
      component: 'email'
    });
  },

  middlewareError: (middleware: string, error: unknown, context?: LogContext) => {
    structuredLogger.error(`Middleware Error: ${middleware}`, error, {
      ...context,
      component: 'middleware'
    });
  },

  // Performance and operational logging
  performance: (operation: string, duration: number, context?: LogContext) => {
    logger.info({
      ...context,
      duration,
      component: 'performance'
    }, `Operation ${operation} completed in ${duration}ms`);
  },

  // Security-related logging
  security: (event: string, context?: LogContext) => {
    logger.warn({
      ...context,
      component: 'security'
    }, `Security Event: ${event}`);
  }
};

// Export the base logger for advanced use cases
export { logger };

// Backward compatibility - maps console.error to structured logging
export const logError = (message: string, error?: unknown, context?: LogContext) => {
  structuredLogger.error(message, error, context);
};

// Helper to extract request context from Next.js request objects
export const getRequestContext = (req: RequestLike | undefined): LogContext => {
  const headers = req?.headers;
  return {
    method: req?.method,
    path: req?.url ?? req?.nextUrl?.pathname,
    userAgent: getHeaderValue(headers, 'user-agent'),
    ip: req?.ip ?? getHeaderValue(headers, 'x-forwarded-for'),
    requestId: getHeaderValue(headers, 'x-request-id'),
  };
};

export default structuredLogger;
