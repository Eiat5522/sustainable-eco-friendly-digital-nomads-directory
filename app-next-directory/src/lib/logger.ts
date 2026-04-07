import pino from 'pino';
import validator from 'validator';

// Environment check for safe logging configuration
// Guard access to `process` so this module can be imported in Edge or client contexts
const _env: NodeJS.ProcessEnv | Record<string, unknown> =
  typeof process !== 'undefined' && typeof process.env !== 'undefined'
    ? process.env
    : typeof globalThis !== 'undefined'
      ? ((globalThis as { __env?: Record<string, unknown> }).__env ?? {})
      : {};

const isProduction = _env.NODE_ENV === 'production';
const isDevelopment = _env.NODE_ENV === 'development';
const isTest = _env.NODE_ENV === 'test';
const isE2E = _env.E2E === '1';

// Check if we're running in a Node.js environment (server-side)
// pino-pretty with worker threads doesn't work well in Next.js server contexts
const isServer = typeof window === 'undefined' && typeof process !== 'undefined';
const shouldMirrorStructuredLogsToConsole =
  isTest || process.env.LOGGER_ENABLE_CONSOLE_MIRROR === '1';

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
  'error.config.headers.authorization',
];

type HeaderGetter = (name: string) => string | null | undefined;
type HeaderValue = string | string[] | undefined;
type HeaderCollection =
  | Headers
  | Map<string, string>
  | (Record<string, HeaderValue> & { get?: HeaderGetter });

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

const getHeaderValue = (
  headers: HeaderCollection | undefined,
  name: string
): string | undefined => {
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
    censor: '[REDACTED]',
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
      const maskedEmail = email?.includes('@')
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
    // Only read runtime process information when running in Node.js
    pid:
      typeof process !== 'undefined' && typeof process.pid !== 'undefined'
        ? process.pid
        : undefined,
    hostname: _env.HOSTNAME || 'unknown',
    service: 'sustainable-nomads-directory',
    version: _env.npm_package_version || '0.1.0',
  },
};

// Configure pretty printing for development by using pino's transport API.
const createPrettyTransport = (): pino.DestinationStream | undefined => {
  if (!isDevelopment || !isServer) {
    return undefined;
  }

  try {
    return pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
        singleLine: false,
      },
    }) as unknown as pino.DestinationStream;
  } catch {
    return undefined;
  }
};

const prettyTransport = createPrettyTransport();
const logger: pino.Logger = prettyTransport
  ? pino(loggerConfig, prettyTransport)
  : pino(loggerConfig);

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
    mirrorStructuredLogToConsole('debug', msg, undefined, context);
    logger.debug(context, msg);
  },

  info: (msg: string, context?: LogContext) => {
    mirrorStructuredLogToConsole('info', msg, undefined, context);
    logger.info(context, msg);
  },

  warn: (msg: string, errorOrContext?: unknown, maybeContext?: LogContext) => {
    // Support older callsites that pass (msg, error, context)
    let err: unknown | undefined;
    let context: LogContext | undefined;

    if (
      errorOrContext &&
      (errorOrContext instanceof Error || typeof errorOrContext === 'object') &&
      !('component' in (errorOrContext as LogContext))
    ) {
      err = errorOrContext;
      context = maybeContext;
    } else {
      context = errorOrContext as LogContext | undefined;
    }

    if (err) {
      const sanitizedError = sanitizeError(err);
      const errorPayload = sanitizedError ? (sanitizedError as unknown as LogValue) : undefined;
      const logContext: LogContext = {
        ...(context ?? {}),
        ...(errorPayload ? { err: errorPayload, error: errorPayload } : {}),
      };
      mirrorStructuredLogToConsole('warn', msg, err, logContext);
      logger.warn(logContext, msg);
    } else {
      mirrorStructuredLogToConsole('warn', msg, undefined, context);
      logger.warn(context, msg);
    }
  },

  error: (msg: string, error?: unknown, context?: LogContext) => {
    const sanitizedError = sanitizeError(error);
    const errorPayload = sanitizedError ? (sanitizedError as unknown as LogValue) : undefined;
    const logContext: LogContext = {
      ...context,
      ...(errorPayload ? { err: errorPayload, error: errorPayload } : {}),
    };
    mirrorStructuredLogToConsole('error', msg, error, logContext);
    // Use a write-behind queue to avoid calling Date.now() (via pino) while
    // a Server Component is rendering. We enqueue the log entry synchronously
    // and flush it on the next tick. This preserves call ordering relative to
    // other synchronous code and avoids the Next.js prerender error.
    // We also register graceful flush handlers so logs are written before
    // process exit where possible.

    type QueueEntry = { msg: string; error?: unknown; context?: LogContext };

    const globalAny = globalThis as unknown as {
      __logQueue?: QueueEntry[];
      __logFlushScheduled?: boolean;
    };

    if (!globalAny.__logQueue) globalAny.__logQueue = [];

    globalAny.__logQueue.push({ msg, error, context: logContext });

    const scheduleFlush = () => {
      if (globalAny.__logFlushScheduled) return;
      globalAny.__logFlushScheduled = true;
      try {
        // Use setImmediate when available to flush after the current event turn.
        const flushFn = () => {
          globalAny.__logFlushScheduled = false;
          const q = globalAny.__logQueue ?? [];
          globalAny.__logQueue = [];
          for (const entry of q) {
            try {
              logger.error(entry.context ?? {}, entry.msg);
            } catch (_) {
              // Swallow errors during logging to avoid affecting app flow
            }
          }
        };

        if (typeof setImmediate === 'function') {
          setImmediate(flushFn);
        } else if (typeof queueMicrotask === 'function') {
          queueMicrotask(flushFn);
        } else {
          Promise.resolve()
            .then(flushFn)
            .catch(() => undefined);
        }
      } catch (_e) {
        // As a last resort, perform synchronous logging
        try {
          logger.error(logContext, msg);
        } catch (_) {
          // ignore
        }
      }
    };

    scheduleFlush();

    // In some environments (Edge runtime / Turbopack analysis) Node process
    // APIs are not available and cause build-time errors. The installation of
    // process-level handlers is therefore performed in a separate node-only
    // module (`src/lib/logger-node.ts`) that is only imported by server-only
    // entrypoints. Here we simply call a noop placeholder which will be
    // replaced by the real installer when running in Node.js server code.
    // This avoids Turbopack build errors while preserving graceful flushes
    // when running the server.
  },

  // Specialized logging methods for common use cases
  apiError: (endpoint: string, error: unknown, context?: Omit<LogContext, 'path'>) => {
    structuredLogger.error(`API Error in ${endpoint}`, error, {
      ...context,
      path: endpoint,
      component: 'api',
    });
  },

  authError: (action: string, error: unknown, context?: LogContext) => {
    structuredLogger.error(`Auth Error: ${action}`, error, {
      ...context,
      component: 'auth',
    });
  },

  emailError: (action: string, error: unknown, context?: LogContext) => {
    structuredLogger.error(`Email Error: ${action}`, error, {
      ...context,
      component: 'email',
    });
  },

  middlewareError: (middleware: string, error: unknown, context?: LogContext) => {
    structuredLogger.error(`Middleware Error: ${middleware}`, error, {
      ...context,
      component: 'middleware',
    });
  },

  // Performance and operational logging
  performance: (operation: string, duration: number, context?: LogContext) => {
    const logContext = {
      ...context,
      duration,
      component: 'performance',
    };
    const message = `Operation ${operation} completed in ${duration}ms`;
    mirrorStructuredLogToConsole('info', message, undefined, logContext);
    logger.info(logContext, message);
  },

  // Security-related logging
  security: (event: string, context?: LogContext) => {
    const logContext = {
      ...context,
      component: 'security',
    };
    const message = `Security Event: ${event}`;
    mirrorStructuredLogToConsole('warn', message, undefined, logContext);
    logger.warn(logContext, message);
  },
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

  const extractIp = (): string | undefined => {
    if (req?.ip && validator.isIP(req.ip)) return req.ip;
    const xf = getHeaderValue(headers, 'x-forwarded-for');
    if (xf) {
      const first = (xf.split(',')[0] || '').trim();
      if (first && validator.isIP(first)) return first;
    }
    const xr = getHeaderValue(headers, 'x-real-ip');
    if (xr && validator.isIP(xr)) return xr;
    return undefined;
  };

  return {
    method: req?.method,
    path: req?.url ?? req?.nextUrl?.pathname,
    userAgent: getHeaderValue(headers, 'user-agent'),
    ip: extractIp(),
    requestId: getHeaderValue(headers, 'x-request-id'),
  };
};

export default structuredLogger;

type ConsoleLevel = 'info' | 'warn' | 'error' | 'debug';

const sanitizeConsoleArg = (arg: unknown): string => {
  if (typeof arg === 'string') return arg;
  // Fallback to JSON.stringify for client-side or when util is unavailable
  try {
    return JSON.stringify(arg, null, 2);
  } catch {
    return String(arg);
  }
};

const formatConsoleInvocation = (
  level: ConsoleLevel,
  args: unknown[]
): {
  message: string;
  error?: unknown;
  context: LogContext;
} => {
  const errorArg = args.find((arg): arg is Error => arg instanceof Error);
  const argsWithoutError = errorArg
    ? args.filter((arg, index) => !(arg instanceof Error) || index !== args.indexOf(errorArg))
    : args;

  let message: string;
  let remainingArgs: unknown[] = [];

  if (argsWithoutError.length > 0 && typeof argsWithoutError[0] === 'string') {
    const [template, ...rest] = argsWithoutError as [string, ...unknown[]];
    // Simple string template formatting without util.formatWithOptions
    message = template;
    remainingArgs = rest;
  } else if (argsWithoutError.length > 0) {
    message = argsWithoutError.map(sanitizeConsoleArg).join(' ');
    remainingArgs = argsWithoutError;
  } else {
    message = errorArg?.message ?? 'Console output';
  }

  const context: LogContext = {
    component: 'console',
    level,
    ...(remainingArgs.length > 0
      ? {
          consoleArgs: remainingArgs.map(sanitizeConsoleArg),
        }
      : {}),
  };

  return { message, error: errorArg, context };
};

const legacyConsoleMethodMap: Record<ConsoleLevel, keyof Console> = {
  info: 'log',
  warn: 'warn',
  error: 'error',
  debug: typeof console.debug === 'function' ? 'debug' : 'log',
};

const isBracketPrefixedMessage = (message: string): boolean => message.trimStart().startsWith('[');

const buildLegacyConsoleArgs = (
  message: string,
  error?: unknown,
  context?: LogContext
): unknown[] => {
  if (!message) {
    return [];
  }

  const args: unknown[] = [];
  const statusValues: Array<number | string> = [];

  const status = (context as { status?: number | string })?.status;
  if (typeof status === 'number' || typeof status === 'string') {
    statusValues.push(status);
  }

  const statusCode = (context as { statusCode?: number | string })?.statusCode;
  if (
    (typeof statusCode === 'number' || typeof statusCode === 'string') &&
    (statusValues.length === 0 || statusValues[0] !== statusCode)
  ) {
    statusValues.push(statusCode);
  }

  const statusText = (context as { statusText?: string })?.statusText;
  if (typeof statusText === 'string' && statusText.length > 0) {
    statusValues.push(statusText);
  }

  const hasError = typeof error !== 'undefined';
  const hasExtraArgs = hasError || statusValues.length > 0;
  const trimmedMessage = message.trimEnd();
  const shouldAppendColon =
    hasExtraArgs && !isBracketPrefixedMessage(message) && !trimmedMessage.endsWith(':');
  const normalizedMessage = shouldAppendColon ? `${message}:` : message;

  args.push(normalizedMessage);
  if (statusValues.length) {
    args.push(...statusValues);
  }
  if (hasError) {
    args.push(error);
  }
  return args;
};

const mirrorStructuredLogToConsole = (
  level: ConsoleLevel,
  message: string,
  error?: unknown,
  context?: LogContext
) => {
  if (!shouldMirrorStructuredLogsToConsole) {
    return;
  }

  const method = legacyConsoleMethodMap[level];
  const consoleMethod = console[method];
  const fn =
    typeof consoleMethod === 'function'
      ? (consoleMethod as (...args: unknown[]) => void).bind(console)
      : undefined;
  if (typeof fn !== 'function') {
    return;
  }

  const args = buildLegacyConsoleArgs(message, error, context);
  if (!args.length) {
    return;
  }

  try {
    fn(...args);
  } catch {
    // Swallow console mirroring errors to keep tests reliable
  }
};

let consoleRedirectInstalled = false;

export const redirectConsoleToStructuredLogger = () => {
  // Avoid installing console redirection while running unit tests
  if (isTest || consoleRedirectInstalled || !isServer) {
    return;
  }

  consoleRedirectInstalled = true;

  const levelMap: Record<'log' | 'info' | 'warn' | 'error' | 'debug', ConsoleLevel> = {
    log: 'info',
    info: 'info',
    warn: 'warn',
    error: 'error',
    debug: 'debug',
  };

  (Object.keys(levelMap) as Array<keyof typeof levelMap>).forEach(method => {
    const level = levelMap[method];
    console[method] = (...args: unknown[]) => {
      const { message, error, context } = formatConsoleInvocation(level, args);

      switch (level) {
        case 'info':
          structuredLogger.info(message, context);
          break;
        case 'warn':
          structuredLogger.warn(message, context);
          break;
        case 'debug':
          structuredLogger.debug(message, context);
          break;
        case 'error':
          structuredLogger.error(message, error, context);
          break;
      }
    };
  });
};

if (isServer && !isTest) {
  redirectConsoleToStructuredLogger();

  import('./logger-node')
    .then(({ installExitFlushHandlers }) => {
      if (typeof installExitFlushHandlers === 'function') {
        installExitFlushHandlers();
      }
    })
    .catch(() => {
      // ignore: best-effort; in edge/compiled contexts this file may not exist
    });
}
