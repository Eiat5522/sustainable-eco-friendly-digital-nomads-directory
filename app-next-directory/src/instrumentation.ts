/**
 * Next.js Instrumentation
 * 
 * This file sets up global error handlers for the server runtime.
 * It helps prevent server crashes from unhandled promise rejections,
 * particularly from MongoDB connection issues.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
      console.error('Unhandled Promise Rejection at:', promise);
      console.error('Reason:', reason);
      
      // Log but don't crash the server
      if (reason instanceof Error) {
        console.error('Error stack:', reason.stack);
        
        // Special handling for MongoDB errors
        if (reason.message?.includes('MongoServerSelectionError') || 
            reason.message?.includes('Server selection timed out')) {
          console.error('MongoDB connection issue detected. The server will continue running and retry on next request.');
        }
      }
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      console.error('Uncaught Exception:', error);
      console.error('Stack:', error.stack);
      
      // For MongoDB errors, log but don't exit
      if (error.message?.includes('MongoServerSelectionError') || 
          error.message?.includes('Server selection timed out')) {
        console.error('MongoDB connection issue detected. Continuing...');
        return;
      }
      
      // For other critical errors, we may want to exit
      // but in development, we'll just log
      if (process.env.NODE_ENV === 'development') {
        console.error('Development mode: Server will continue running');
      } else {
        // In production, critical errors should exit
        process.exit(1);
      }
    });

    console.log('Server instrumentation registered: Error handlers active');
  }
}
