/**
 * Next.js Instrumentation
 *
 * This file sets up global error handlers for the server runtime.
 * It helps prevent server crashes from unhandled promise rejections,
 * particularly from MongoDB connection issues.
 */

type InstrumentationEvent = 'unhandledRejection' | 'uncaughtException';
type InstrumentationListenerMap = {
  unhandledRejection: NodeJS.UnhandledRejectionListener | null;
  uncaughtException: NodeJS.UncaughtExceptionListener | null;
};

const listenerRegistry: InstrumentationListenerMap = {
  unhandledRejection: null,
  uncaughtException: null,
};

let hasInstalledProcessHandlers = false;

const nodeProcess =
  typeof globalThis === 'undefined'
    ? undefined
    : (globalThis as { process?: NodeJS.Process }).process;

const attachProcessListener = <E extends InstrumentationEvent>(
  event: E,
  listener: E extends 'unhandledRejection'
    ? NodeJS.UnhandledRejectionListener
    : NodeJS.UncaughtExceptionListener
) => {
  if (!nodeProcess || listenerRegistry[event]) {
    return;
  }

  nodeProcess.on(event, listener as (...args: unknown[]) => void);
  listenerRegistry[event] = listener as InstrumentationListenerMap[E];
};

const attachProcessHandlers = (
  structuredLogger: typeof import('@/lib/logger').structuredLogger
) => {
  if (!nodeProcess || hasInstalledProcessHandlers) {
    return;
  }

  const serializeReason = (reason: unknown): string => {
    if (typeof reason === 'string') return reason;
    if (reason === null || typeof reason === 'undefined') return 'undefined';
    if (typeof reason === 'number' || typeof reason === 'boolean') {
      return String(reason);
    }
    try {
      return JSON.stringify(reason);
    } catch {
      return String(reason);
    }
  };

  const rejectionHandler: NodeJS.UnhandledRejectionListener = (reason: unknown) => {
    const baseContext = {
      component: 'instrumentation' as const,
      details: {
        event: 'unhandledRejection',
      },
    };

    if (reason instanceof Error) {
      structuredLogger.error('Unhandled Promise Rejection', reason, baseContext);

      if (
        reason.message?.includes('MongoServerSelectionError') ||
        reason.message?.includes('Server selection timed out')
      ) {
        structuredLogger.warn(
          'MongoDB connection issue detected. The server will continue running and retry on next request.',
          {
            component: 'instrumentation' as const,
          }
        );
      }
      return;
    }

    structuredLogger.error('Unhandled Promise Rejection', undefined, {
      ...baseContext,
      details: {
        ...baseContext.details,
        reason: serializeReason(reason),
      },
    });
  };

  const exceptionHandler: NodeJS.UncaughtExceptionListener = (error: Error) => {
    structuredLogger.error('Uncaught Exception', error, {
      component: 'instrumentation',
    });
    if (
      error.message?.includes('MongoServerSelectionError') ||
      error.message?.includes('Server selection timed out')
    ) {
      structuredLogger.warn('MongoDB connection issue detected. Continuing...', {
        component: 'instrumentation',
      });
      return;
    }

    const nodeEnv = nodeProcess?.env?.NODE_ENV;
    if (nodeEnv === 'development') {
      structuredLogger.warn(
        'Development mode: Server will continue running after uncaught exception',
        {
          component: 'instrumentation',
        }
      );
    } else {
      nodeProcess?.exit(1);
    }
  };

  attachProcessListener('unhandledRejection', rejectionHandler);
  attachProcessListener('uncaughtException', exceptionHandler);
  hasInstalledProcessHandlers = true;
};

export async function register() {
  const env = nodeProcess?.env;

  // Skip strict validation in e2e test environment
  if (env && env.NODE_ENV === 'production' && env.E2E !== '1') {
    const required = [
      'NEXTAUTH_SECRET',
      'MONGODB_URI',
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN',
      'NEXT_PUBLIC_SANITY_PROJECT_ID',
    ];

    const missing = required.filter(key => !env[key]);

    if (missing.length > 0) {
      throw new Error(
        `Missing critical environment variables: ${missing.join(', ')}\n` +
          'Application cannot start without these variables in production.'
      );
    }
  }

  if (env && env.NEXT_RUNTIME === 'nodejs') {
    const { redirectConsoleToStructuredLogger, structuredLogger } = await import('@/lib/logger');

    // Avoid reassigning global console during Jest unit tests so that
    // `jest.spyOn(console, ...)` remains attached to the real console methods.
    if (env.NODE_ENV !== 'test') {
      redirectConsoleToStructuredLogger();
    }

    // Skip process hooks when running pure Jest tests to prevent repeated listeners.
    if (env.NODE_ENV !== 'test') {
      attachProcessHandlers(structuredLogger);
    }

    structuredLogger.info('Server instrumentation registered: Error handlers active', {
      component: 'instrumentation',
    });
  }
}

export const resetInstrumentationForTests = () => {
  if (!nodeProcess) {
    return;
  }

  const env = nodeProcess.env;
  if (env.NODE_ENV !== 'test') {
    return;
  }

  if (listenerRegistry.unhandledRejection) {
    nodeProcess.removeListener('unhandledRejection', listenerRegistry.unhandledRejection);
    listenerRegistry.unhandledRejection = null;
  }
  if (listenerRegistry.uncaughtException) {
    nodeProcess.removeListener('uncaughtException', listenerRegistry.uncaughtException);
    listenerRegistry.uncaughtException = null;
  }

  hasInstalledProcessHandlers = false;
};
