/**
 * Next.js Instrumentation
 *
 * This file sets up global error handlers for the server runtime.
 * It helps prevent server crashes from unhandled promise rejections,
 * particularly from MongoDB connection issues.
 */

export async function register() {
  if (process.env.NODE_ENV === 'production') {
    const required = [
      'NEXTAUTH_SECRET',
      'MONGODB_URI',
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN',
      'NEXT_PUBLIC_SANITY_PROJECT_ID',
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(
        `Missing critical environment variables: ${missing.join(', ')}\n` +
          'Application cannot start without these variables in production.'
      );
    }
  }

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { redirectConsoleToStructuredLogger, structuredLogger } = await import('@/lib/logger');

    // Avoid reassigning global console during Jest unit tests so that
    // `jest.spyOn(console, ...)` remains attached to the real console methods.
    if (process.env.NODE_ENV !== 'test') {
      redirectConsoleToStructuredLogger();
    }

    const logInTest = <T extends (...args: unknown[]) => void>(fn: T, ...args: Parameters<T>) => {
      if (process.env.NODE_ENV === 'test') {
        fn(...args);
      }
    };

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: unknown) => {
      structuredLogger.error('Unhandled Promise Rejection', undefined, {
        component: 'instrumentation',
        details: {
          event: 'unhandledRejection',
        },
      });
      logInTest(console.error, 'Unhandled Promise Rejection', reason);

      if (reason instanceof Error) {
        structuredLogger.error('Unhandled Promise Rejection reason', reason, {
          component: 'instrumentation',
        });
        logInTest(console.error, 'Unhandled Promise Rejection reason', reason);

        if (
          reason.message?.includes('MongoServerSelectionError') ||
          reason.message?.includes('Server selection timed out')
        ) {
          structuredLogger.warn(
            'MongoDB connection issue detected. The server will continue running and retry on next request.',
            {
              component: 'instrumentation',
            }
          );
          logInTest(
            console.warn,
            'MongoDB connection issue detected. The server will continue running and retry on next request.'
          );
        }
      }
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      structuredLogger.error('Uncaught Exception', error, {
        component: 'instrumentation',
      });
      logInTest(console.error, 'Uncaught Exception:', error);

      if (
        error.message?.includes('MongoServerSelectionError') ||
        error.message?.includes('Server selection timed out')
      ) {
        structuredLogger.warn('MongoDB connection issue detected. Continuing...', {
          component: 'instrumentation',
        });
        logInTest(console.warn, 'MongoDB connection issue detected. Continuing...');
        return;
      }

      if (process.env.NODE_ENV === 'development') {
        structuredLogger.warn(
          'Development mode: Server will continue running after uncaught exception',
          {
            component: 'instrumentation',
          }
        );
        logInTest(console.error, 'Development mode: Server will continue running');
      } else {
        process.exit(1);
      }
    });

    structuredLogger.info('Server instrumentation registered: Error handlers active', {
      component: 'instrumentation',
    });
    logInTest(console.log, 'Server instrumentation registered: Error handlers active');
  }
}
