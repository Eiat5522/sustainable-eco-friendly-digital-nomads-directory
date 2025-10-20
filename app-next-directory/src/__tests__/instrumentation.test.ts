import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

import { register } from '../instrumentation';

type ListenerMap = Record<string, ((...args: any[]) => void) | undefined>;

describe('instrumentation register', () => {
  const originalNextRuntime = process.env.NEXT_RUNTIME;
  const originalNodeEnv = process.env.NODE_ENV;

  let listeners: ListenerMap;
  let processOnSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    listeners = {};
    process.env.NEXT_RUNTIME = 'nodejs';
    process.env.NODE_ENV = 'production';

    processOnSpy = jest.spyOn(process, 'on').mockImplementation((event: any, handler: any) => {
      listeners[event as string] = handler as (...args: any[]) => void;
      return process;
    });

    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as any);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    processOnSpy.mockRestore();
    processExitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    process.env.NEXT_RUNTIME = originalNextRuntime;
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('registers rejection and exception handlers when running in the node runtime', () => {
    register();

    expect(processOnSpy).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));
    expect(processOnSpy).toHaveBeenCalledWith('uncaughtException', expect.any(Function));
    expect(consoleLogSpy).toHaveBeenCalledWith('Server instrumentation registered: Error handlers active');

    const rejectionHandler = listeners.unhandledRejection;
    expect(rejectionHandler).toBeDefined();

    const rejectionError = new Error('MongoServerSelectionError: connection timeout');
    rejectionHandler?.(rejectionError, Promise.resolve());

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'MongoDB connection issue detected. The server will continue running and retry on next request.',
    );
    expect(processExitSpy).not.toHaveBeenCalled();
  });

  it('handles non-error rejection reasons without crashing the process', () => {
    register();

    const rejectionHandler = listeners.unhandledRejection;
    expect(rejectionHandler).toBeDefined();

    rejectionHandler?.('transient network blip', Promise.resolve());

    expect(consoleErrorSpy).toHaveBeenCalledWith('Reason:', 'transient network blip');
    expect(consoleErrorSpy).not.toHaveBeenCalledWith('Error stack:', expect.anything());
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      'MongoDB connection issue detected. The server will continue running and retry on next request.',
    );
  });

  it('logs Mongo retry guidance when server selection timeouts occur', () => {
    register();

    const rejectionHandler = listeners.unhandledRejection;
    rejectionHandler?.(new Error('Server selection timed out after 5000 ms'), Promise.resolve());

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'MongoDB connection issue detected. The server will continue running and retry on next request.',
    );
  });

  it('logs the rejection reason without Mongo messaging for unrelated errors', () => {
    register();

    const rejectionHandler = listeners.unhandledRejection;
    const genericError = new Error('Generic failure');
    rejectionHandler?.(genericError, Promise.resolve());

    expect(consoleErrorSpy).toHaveBeenCalledWith('Reason:', genericError);
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      'MongoDB connection issue detected. The server will continue running and retry on next request.',
    );
  });

  it('prevents process exit for Mongo related uncaught exceptions', () => {
    register();

    const exceptionHandler = listeners.uncaughtException;
    expect(exceptionHandler).toBeDefined();

    exceptionHandler?.(new Error('MongoServerSelectionError: primary down'));

    expect(processExitSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith('MongoDB connection issue detected. Continuing...');
  });

  it('logs the failure context and exits the process for critical production errors', () => {
    register();

    const exceptionHandler = listeners.uncaughtException;
    exceptionHandler?.(new Error('Unexpected fatal error'));

    expect(processExitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).not.toHaveBeenCalledWith('Development mode: Server will continue running');
  });

  it('keeps the server alive in development mode for non-mongo exceptions', () => {
    process.env.NODE_ENV = 'development';

    register();

    const exceptionHandler = listeners.uncaughtException;
    exceptionHandler?.(new Error('Rendering error'));

    expect(processExitSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Development mode: Server will continue running');
  });

  it('skips registration when executed outside of the node runtime', () => {
    process.env.NEXT_RUNTIME = 'edge';

    register();

    expect(processOnSpy).not.toHaveBeenCalled();
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });
});
