import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as loggerModule from '@/lib/logger';

import { register, resetInstrumentationForTests } from '../instrumentation';

type ListenerMap = Record<string, ((...args: unknown[]) => void) | undefined>;

describe('instrumentation register', () => {
  const originalNextRuntime = process.env.NEXT_RUNTIME;
  const originalNodeEnv = process.env.NODE_ENV;

  let listeners: ListenerMap;
  let processOnSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;
  let loggerInfoSpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    listeners = {};
    process.env.NEXT_RUNTIME = 'nodejs';
    process.env.NODE_ENV = 'development';
    resetInstrumentationForTests();
    jest.clearAllMocks();

    loggerInfoSpy = jest
      .spyOn(loggerModule.structuredLogger, 'info')
      .mockImplementation(() => undefined);
    loggerWarnSpy = jest
      .spyOn(loggerModule.structuredLogger, 'warn')
      .mockImplementation(() => undefined);
    loggerErrorSpy = jest
      .spyOn(loggerModule.structuredLogger, 'error')
      .mockImplementation(() => undefined);

    processOnSpy = jest
      .spyOn(process, 'on')
      .mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
        listeners[event as string] = handler as (...args: unknown[]) => void;
        return process;
      });

    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
  });

  afterEach(() => {
    processOnSpy.mockRestore();
    processExitSpy.mockRestore();
    loggerInfoSpy.mockRestore();
    loggerWarnSpy.mockRestore();
    loggerErrorSpy.mockRestore();
    process.env.NEXT_RUNTIME = originalNextRuntime;
    process.env.NODE_ENV = originalNodeEnv;
    resetInstrumentationForTests();
    jest.clearAllMocks();
  });

  it('registers rejection and exception handlers when running in the node runtime', async () => {
    await register();

    expect(processOnSpy).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));
    expect(processOnSpy).toHaveBeenCalledWith('uncaughtException', expect.any(Function));
    expect(loggerModule.structuredLogger.info).toHaveBeenCalledWith(
      'Server instrumentation registered: Error handlers active',
      { component: 'instrumentation' }
    );

    const rejectionHandler = listeners.unhandledRejection;
    expect(rejectionHandler).toBeDefined();

    const rejectionError = new Error('MongoServerSelectionError: connection timeout');
    rejectionHandler?.(rejectionError, Promise.resolve());

    expect(loggerModule.structuredLogger.error).toHaveBeenCalledWith(
      'Unhandled Promise Rejection',
      rejectionError,
      expect.objectContaining({
        component: 'instrumentation',
        details: { event: 'unhandledRejection' },
      })
    );
    expect(loggerModule.structuredLogger.warn).toHaveBeenCalledWith(
      'MongoDB connection issue detected. The server will continue running and retry on next request.',
      { component: 'instrumentation' }
    );
    expect(processExitSpy).not.toHaveBeenCalled();
  });

  it('handles non-error rejection reasons without crashing the process', async () => {
    await register();

    const rejectionHandler = listeners.unhandledRejection;
    expect(rejectionHandler).toBeDefined();

    rejectionHandler?.('transient network blip', Promise.resolve());

    expect(loggerModule.structuredLogger.error).toHaveBeenCalledWith(
      'Unhandled Promise Rejection',
      undefined,
      expect.objectContaining({
        component: 'instrumentation',
        details: expect.objectContaining({
          event: 'unhandledRejection',
          reason: 'transient network blip',
        }),
      })
    );
    expect(loggerModule.structuredLogger.warn).not.toHaveBeenCalled();
  });

  it('logs Mongo retry guidance when server selection timeouts occur', async () => {
    await register();

    const rejectionHandler = listeners.unhandledRejection;
    rejectionHandler?.(new Error('Server selection timed out after 5000 ms'), Promise.resolve());

    expect(loggerModule.structuredLogger.warn).toHaveBeenCalledWith(
      'MongoDB connection issue detected. The server will continue running and retry on next request.',
      { component: 'instrumentation' }
    );
  });

  it('logs the rejection reason without Mongo messaging for unrelated errors', async () => {
    await register();

    const rejectionHandler = listeners.unhandledRejection;
    const genericError = new Error('Generic failure');
    rejectionHandler?.(genericError, Promise.resolve());

    expect(loggerModule.structuredLogger.error).toHaveBeenCalledWith(
      'Unhandled Promise Rejection',
      genericError,
      expect.objectContaining({
        component: 'instrumentation',
        details: { event: 'unhandledRejection' },
      })
    );
    expect(loggerModule.structuredLogger.warn).not.toHaveBeenCalledWith(
      'MongoDB connection issue detected. The server will continue running and retry on next request.',
      expect.anything()
    );
  });

  it('prevents process exit for Mongo related uncaught exceptions', async () => {
    await register();

    const exceptionHandler = listeners.uncaughtException;
    expect(exceptionHandler).toBeDefined();

    exceptionHandler?.(new Error('MongoServerSelectionError: primary down'));

    expect(processExitSpy).not.toHaveBeenCalled();
    expect(loggerModule.structuredLogger.warn).toHaveBeenCalledWith(
      'MongoDB connection issue detected. Continuing...',
      { component: 'instrumentation' }
    );
  });

  it('logs the failure context and exits the process for critical production errors', async () => {
    process.env.NODE_ENV = 'production';
    await register();

    const exceptionHandler = listeners.uncaughtException;
    exceptionHandler?.(new Error('Unexpected fatal error'));

    expect(processExitSpy).toHaveBeenCalledWith(1);
    expect(loggerModule.structuredLogger.warn).not.toHaveBeenCalledWith(
      'Development mode: Server will continue running after uncaught exception',
      expect.anything()
    );
  });

  it('keeps the server alive in development mode for non-mongo exceptions', async () => {
    process.env.NODE_ENV = 'development';

    await register();

    const exceptionHandler = listeners.uncaughtException;
    exceptionHandler?.(new Error('Rendering error'));

    expect(processExitSpy).not.toHaveBeenCalled();
    expect(loggerModule.structuredLogger.warn).toHaveBeenCalledWith(
      'Development mode: Server will continue running after uncaught exception',
      { component: 'instrumentation' }
    );
  });

  it('skips registration when executed outside of the node runtime', async () => {
    process.env.NEXT_RUNTIME = 'edge';

    await register();

    expect(processOnSpy).not.toHaveBeenCalled();
    expect(loggerModule.structuredLogger.info).not.toHaveBeenCalled();
  });
});
