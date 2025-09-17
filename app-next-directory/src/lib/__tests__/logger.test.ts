// Mock pino before importing the logger
jest.mock('pino', () => {
  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  
  const pinoMock = jest.fn(() => mockLogger);
  pinoMock.stdSerializers = {
    err: jest.fn(),
    req: jest.fn(),
    res: jest.fn()
  };
  
  return pinoMock;
});

import { structuredLogger, logError, getRequestContext } from '../logger';

// Import the mocked pino and get the logger instance
import pino = require('pino');
const mockPino = pino as any as jest.MockedFunction<any>;
const mockLogger = mockPino();

describe('Structured Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Core logging methods', () => {
    it('should log debug messages with context', () => {
      const context = { userId: 'user123', component: 'test' };
      structuredLogger.debug('Debug message', context);
      
      expect(mockLogger.debug).toHaveBeenCalledWith(context, 'Debug message');
    });

    it('should log info messages with context', () => {
      const context = { requestId: 'req123' };
      structuredLogger.info('Info message', context);
      
      expect(mockLogger.info).toHaveBeenCalledWith(context, 'Info message');
    });

    it('should log warning messages with context', () => {
      const context = { userAgent: 'test-agent' };
      structuredLogger.warn('Warning message', context);
      
      expect(mockLogger.warn).toHaveBeenCalledWith(context, 'Warning message');
    });

    it('should log error messages with sanitized error objects', () => {
      const error = new Error('Test error');
      error.stack = 'stack trace';
      const context = { userId: 'user123' };
      
      structuredLogger.error('Error message', error, context);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          ...context,
          err: expect.objectContaining({
            message: 'Test error',
            name: 'Error'
          }),
          error: expect.objectContaining({
            message: 'Test error',
            name: 'Error'
          })
        }),
        'Error message'
      );
    });
  });

  describe('Specialized logging methods', () => {
    it('should log API errors with endpoint context', () => {
      const error = new Error('API failed');
      const context = { userId: 'user123' };
      
      structuredLogger.apiError('/api/test', error, context);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          ...context,
          path: '/api/test',
          component: 'api',
          err: expect.objectContaining({
            message: 'API failed'
          })
        }),
        'API Error in /api/test'
      );
    });

    it('should log authentication errors', () => {
      const error = new Error('Auth failed');
      const context = { userId: 'user123' };
      
      structuredLogger.authError('login', error, context);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          ...context,
          component: 'auth',
          err: expect.objectContaining({
            message: 'Auth failed'
          })
        }),
        'Auth Error: login'
      );
    });

    it('should log email errors', () => {
      const error = new Error('Email send failed');
      
      structuredLogger.emailError('send verification', error);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          component: 'email',
          err: expect.objectContaining({
            message: 'Email send failed'
          })
        }),
        'Email Error: send verification'
      );
    });

    it('should log middleware errors', () => {
      const error = new Error('Middleware failed');
      
      structuredLogger.middlewareError('auth-middleware', error);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          component: 'middleware',
          err: expect.objectContaining({
            message: 'Middleware failed'
          })
        }),
        'Middleware Error: auth-middleware'
      );
    });

    it('should log performance metrics', () => {
      const context = { userId: 'user123' };
      
      structuredLogger.performance('database-query', 150, context);
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          ...context,
          duration: 150,
          component: 'performance'
        }),
        'Operation database-query completed in 150ms'
      );
    });

    it('should log security events', () => {
      const context = { ip: '192.168.1.1' };
      
      structuredLogger.security('suspicious-login-attempt', context);
      
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          ...context,
          component: 'security'
        }),
        'Security Event: suspicious-login-attempt'
      );
    });
  });

  describe('Error sanitization', () => {
    it('should sanitize sensitive fields from error objects', () => {
      const error = {
        message: 'Test error',
        password: 'secret123',
        token: 'jwt-token',
        apiKey: 'api-key-123',
        config: {
          headers: {
            authorization: 'Bearer token123'
          }
        }
      };
      
      structuredLogger.error('Sanitization test', error);
      
      const logCall = mockLogger.error.mock.calls[0];
      const loggedError = logCall[0].err;
      
      expect(loggedError.message).toBe('Test error');
      expect(loggedError.password).toBeUndefined();
      expect(loggedError.token).toBeUndefined();
      expect(loggedError.apiKey).toBeUndefined();
    });

    it('should handle null and undefined errors gracefully', () => {
      structuredLogger.error('No error object', null);
      structuredLogger.error('Undefined error', undefined);
      
      expect(mockLogger.error).toHaveBeenCalledTimes(2);
    });
  });

  describe('Backward compatibility', () => {
    it('should provide logError function for console.error replacement', () => {
      const error = new Error('Test error');
      const context = { userId: 'user123' };
      
      logError('Compatibility test', error, context);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          ...context,
          err: expect.objectContaining({
            message: 'Test error'
          })
        }),
        'Compatibility test'
      );
    });
  });

  describe('Request context extraction', () => {
    it('should extract context from Next.js request objects', () => {
      const mockRequest = {
        method: 'POST',
        url: '/api/test',
        headers: {
          get: jest.fn()
            .mockReturnValueOnce('Mozilla/5.0') // user-agent
            .mockReturnValueOnce('192.168.1.1') // x-forwarded-for
            .mockReturnValueOnce('req-123') // x-request-id
        }
      };
      
      const context = getRequestContext(mockRequest);
      
      expect(context).toEqual({
        method: 'POST',
        path: '/api/test',
        userAgent: 'Mozilla/5.0',
        ip: '192.168.1.1',
        requestId: 'req-123'
      });
    });

    it('should handle legacy request objects with direct header access', () => {
      const mockRequest = {
        method: 'GET',
        url: '/api/legacy',
        headers: {
          'user-agent': 'Legacy Browser',
          'x-forwarded-for': '10.0.0.1'
        }
      };
      
      const context = getRequestContext(mockRequest);
      
      expect(context).toEqual({
        method: 'GET',
        path: '/api/legacy',
        userAgent: 'Legacy Browser',
        ip: '10.0.0.1',
        requestId: undefined
      });
    });

    it('should handle missing request properties gracefully', () => {
      const context = getRequestContext(null);
      
      expect(context).toEqual({
        method: undefined,
        path: undefined,
        userAgent: undefined,
        ip: undefined,
        requestId: undefined
      });
    });
  });
});