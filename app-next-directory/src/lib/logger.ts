import pino from 'pino';

// Environment check for safe logging configuration
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

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

// Create base logger configuration
const loggerConfig: pino.LoggerOptions = {
  level: isProduction ? 'info' : isDevelopment ? 'debug' : 'silent',
  
  // Redaction configuration for security
  redact: {
    paths: redactPaths,
    censor: '[REDACTED]'
  },

  // Serialization for common objects
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
    req: (req: any) => ({
      method: req?.method,
      url: req?.url,
      path: req?.path,
      userAgent: req?.headers?.['user-agent'],
      // Redact sensitive headers
      headers: req?.headers ? {
        ...req.headers,
        authorization: req.headers.authorization ? '[REDACTED]' : undefined,
        cookie: req.headers.cookie ? '[REDACTED]' : undefined
      } : undefined
    }),
    res: (res: any) => ({
      statusCode: res?.statusCode,
      headers: res?.headers ? {
        ...res.headers,
        'set-cookie': res.headers['set-cookie'] ? '[REDACTED]' : undefined
      } : undefined
    }),
    user: (user: any) => ({
      id: user?.id,
      role: user?.role,
      // Redact sensitive user information
      email: user?.email ? `${user.email.substring(0, 3)}***@${user.email.split('@')[1]}` : undefined
    })
  },

  // Base fields for all logs
  base: {
    pid: process.pid,
    hostname: process.env.HOSTNAME || 'unknown',
    service: 'sustainable-nomads-directory',
    version: process.env.npm_package_version || '0.1.0'
  }
};

// Configure transport for development
if (isDevelopment) {
  loggerConfig.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname,service,version'
    }
  };
}

// Create the logger instance
const logger = pino(loggerConfig);

// Enhanced logging interface with context support
interface LogContext {
  [key: string]: any;
  userId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  path?: string;
  method?: string;
}

// Helper function to sanitize error objects
function sanitizeError(error: any): any {
  if (!error) return error;
  
  // Create a sanitized copy of the error
  const sanitized: any = {
    message: error.message,
    name: error.name,
    stack: isProduction ? undefined : error.stack, // Hide stack traces in production
    code: error.code,
    status: error.status || error.statusCode
  };

  // Remove any potentially sensitive properties
  Object.keys(error).forEach(key => {
    if (!redactPaths.some(path => key.toLowerCase().includes(path.toLowerCase()))) {
      sanitized[key] = error[key];
    }
  });

  return sanitized;
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
  
  error: (msg: string, error?: any, context?: LogContext) => {
    const sanitizedError = sanitizeError(error);
    logger.error({ 
      ...context, 
      err: sanitizedError,
      ...(error && { error: sanitizedError })
    }, msg);
  },

  // Specialized logging methods for common use cases
  apiError: (endpoint: string, error: any, context?: Omit<LogContext, 'path'>) => {
    structuredLogger.error(`API Error in ${endpoint}`, error, {
      ...context,
      path: endpoint,
      component: 'api'
    });
  },

  authError: (action: string, error: any, context?: LogContext) => {
    structuredLogger.error(`Auth Error: ${action}`, error, {
      ...context,
      component: 'auth'
    });
  },

  emailError: (action: string, error: any, context?: LogContext) => {
    structuredLogger.error(`Email Error: ${action}`, error, {
      ...context,
      component: 'email'
    });
  },

  middlewareError: (middleware: string, error: any, context?: LogContext) => {
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
export const logError = (message: string, error?: any, context?: LogContext) => {
  structuredLogger.error(message, error, context);
};

// Helper to extract request context from Next.js request objects
export const getRequestContext = (req: any): LogContext => {
  return {
    method: req?.method,
    path: req?.url || req?.nextUrl?.pathname,
    userAgent: req?.headers?.get?.('user-agent') || req?.headers?.['user-agent'],
    ip: req?.ip || req?.headers?.get?.('x-forwarded-for') || req?.headers?.['x-forwarded-for'],
    requestId: req?.headers?.get?.('x-request-id') || req?.headers?.['x-request-id']
  };
};

export default structuredLogger;
