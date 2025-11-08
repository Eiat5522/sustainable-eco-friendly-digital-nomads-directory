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
  let consoleWarnSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    listeners = {};
    process.env.NEXT_RUNTIME = 'nodejs';
    process.env.NODE_ENV = 'test';

    processOnSpy = jest.spyOn(process, 'on').mockImplementation((event: any, handler: any) => {
      listeners[event as string] = handler as (...args: any[]) => void;
      return process;
    });

    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as any);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    processOnSpy.mockRestore();
    processExitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
    process.env.NEXT_RUNTIME = originalNextRuntime;
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('registers rejection and exception handlers when running in the node runtime', async () => {
    await register();

    expect(processOnSpy).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));
    expect(processOnSpy).toHaveBeenCalledWith('uncaughtException', expect.any(Function));
    expect(consoleLogSpy).toHaveBeenCalledWith('Server instrumentation registered: Error handlers active');

    const rejectionHandler = listeners.unhandledRejection;
    expect(rejectionHandler).toBeDefined();

    const rejectionError = new Error('MongoServerSelectionError: connection timeout');
    rejectionHandler?.(rejectionError, Promise.resolve());

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'MongoDB connection issue detected. The server will continue running and retry on next request.',
    );
    expect(processExitSpy).not.toHaveBeenCalled();
  });

  it('handles non-error rejection reasons without crashing the process', async () => {
    await register();

    const rejectionHandler = listeners.unhandledRejection;
    expect(rejectionHandler).toBeDefined();

    rejectionHandler?.('transient network blip', Promise.resolve());

    expect(consoleErrorSpy).toHaveBeenCalledWith('Unhandled Promise Rejection', 'transient network blip');
    expect(consoleErrorSpy).not.toHaveBeenCalledWith('Unhandled Promise Rejection reason', expect.anything());
    expect(consoleWarnSpy).not.toHaveBeenCalledWith(
      'MongoDB connection issue detected. The server will continue running and retry on next request.',
    );
  });

  it('logs Mongo retry guidance when server selection timeouts occur', async () => {
    await register();

    const rejectionHandler = listeners.unhandledRejection;
    rejectionHandler?.(new Error('Server selection timed out after 5000 ms'), Promise.resolve());

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'MongoDB connection issue detected. The server will continue running and retry on next request.',
    );
  });

  it('logs the rejection reason without Mongo messaging for unrelated errors', async () => {
    await register();

    const rejectionHandler = listeners.unhandledRejection;
    const genericError = new Error('Generic failure');
    rejectionHandler?.(genericError, Promise.resolve());

    expect(consoleErrorSpy).toHaveBeenCalledWith('Unhandled Promise Rejection reason', genericError);
    expect(consoleWarnSpy).not.toHaveBeenCalledWith(
      'MongoDB connection issue detected. The server will continue running and retry on next request.',
    );
  });

  it('prevents process exit for Mongo related uncaught exceptions', async () => {
    await register();

    const exceptionHandler = listeners.uncaughtException;
    expect(exceptionHandler).toBeDefined();

    exceptionHandler?.(new Error('MongoServerSelectionError: primary down'));

    expect(processExitSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith('MongoDB connection issue detected. Continuing...');
  });

  it('logs the failure context and exits the process for critical production errors', async () => {
    await register();

    const exceptionHandler = listeners.uncaughtException;
    exceptionHandler?.(new Error('Unexpected fatal error'));

    expect(processExitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).not.toHaveBeenCalledWith('Development mode: Server will continue running');
  });

  it('keeps the server alive in development mode for non-mongo exceptions', async () => {
    process.env.NODE_ENV = 'development';

    await register();

    const exceptionHandler = listeners.uncaughtException;
    exceptionHandler?.(new Error('Rendering error'));

    expect(processExitSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalledWith('Development mode: Server will continue running');
  });

  it('skips registration when executed outside of the node runtime', async () => {
    process.env.NEXT_RUNTIME = 'edge';

    await register();

    expect(processOnSpy).not.toHaveBeenCalled();
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });
});
