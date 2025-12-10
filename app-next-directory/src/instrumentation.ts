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

    // Avoid registering process event listeners during Jest unit tests to prevent
    // open handle leaks that cause Jest workers to fail to exit gracefully.
    if (process.env.NODE_ENV !== 'test') {
      // Handle unhandled promise rejections
      process.on('unhandledRejection', (reason: unknown) => {
        if (reason instanceof Error) {
          console.error('Unhandled Promise Rejection reason', reason);
        } else {
          console.error('Unhandled Promise Rejection', reason);
        }
        structuredLogger.error('Unhandled Promise Rejection', undefined, {
          component: 'instrumentation',
          details: {
            event: 'unhandledRejection',
          },
        });
        if (reason instanceof Error) {
          structuredLogger.error('Unhandled Promise Rejection reason', reason, {
            component: 'instrumentation',
          });

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
          }
        }
      });

      // Handle uncaught exceptions
      process.on('uncaughtException', (error: Error) => {
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

        if (process.env.NODE_ENV === 'development') {
          structuredLogger.warn(
            'Development mode: Server will continue running after uncaught exception',
            {
              component: 'instrumentation',
            }
          );
        } else {
          process.exit(1);
        }
      });
    }

    structuredLogger.info('Server instrumentation registered: Error handlers active', {
      component: 'instrumentation',
    });
  }
}
