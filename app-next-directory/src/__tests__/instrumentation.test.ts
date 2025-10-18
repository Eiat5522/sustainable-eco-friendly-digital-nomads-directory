import { jest } from '@jest/globals';

describe('instrumentation register', () => {
  const originalRuntime = process.env.NEXT_RUNTIME;
  const originalNodeEnv = process.env.NODE_ENV;

  let listeners: Record<string, Array<(...args: any[]) => void>>;
  let onSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    listeners = {};
    onSpy = jest.spyOn(process, 'on').mockImplementation((event, handler) => {
      listeners[event] = listeners[event] ?? [];
      listeners[event]!.push(handler as (...args: any[]) => void);
      return process;
    });
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as unknown as typeof process.exit);
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    onSpy.mockRestore();
    exitSpy.mockRestore();
    logSpy.mockRestore();
    errorSpy.mockRestore();
    process.env.NEXT_RUNTIME = originalRuntime;
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('does not register handlers when not running on the node runtime', async () => {
    process.env.NEXT_RUNTIME = 'edge';

    const { register } = await import('../instrumentation');
    await register();

    expect(onSpy).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalledWith('Server instrumentation registered: Error handlers active');
  });

  it('registers listeners and handles mongo and generic errors', async () => {
    process.env.NEXT_RUNTIME = 'nodejs';

    const { register } = await import('../instrumentation');
    await register();

    expect(onSpy).toHaveBeenCalledTimes(2);
    expect(logSpy).toHaveBeenCalledWith('Server instrumentation registered: Error handlers active');

    const rejectionHandler = listeners['unhandledRejection']?.[0];
    const exceptionHandler = listeners['uncaughtException']?.[0];
    expect(rejectionHandler).toBeDefined();
    expect(exceptionHandler).toBeDefined();

    const mongoError = new Error('MongoServerSelectionError: failed to connect');
    mongoError.stack = 'stack-trace';
    rejectionHandler?.(mongoError, Promise.resolve());

    expect(errorSpy).toHaveBeenCalledWith('Unhandled Promise Rejection at:', expect.any(Promise));
    expect(errorSpy).toHaveBeenCalledWith('Reason:', mongoError);
    expect(errorSpy).toHaveBeenCalledWith('Error stack:', mongoError.stack);
    expect(errorSpy).toHaveBeenCalledWith(
      'MongoDB connection issue detected. The server will continue running and retry on next request.',
    );

    errorSpy.mockClear();
    rejectionHandler?.('non-error', Promise.resolve());
    expect(errorSpy).toHaveBeenCalledWith('Reason:', 'non-error');

    const selectionTimeoutRejection = new Error('Server selection timed out during retry');
    errorSpy.mockClear();
    rejectionHandler?.(selectionTimeoutRejection, Promise.resolve());
    expect(errorSpy).toHaveBeenCalledWith(
      'MongoDB connection issue detected. The server will continue running and retry on next request.',
    );

    const timeoutError = new Error('Server selection timed out after 30s');
    process.env.NODE_ENV = 'production';
    exitSpy.mockClear();
    errorSpy.mockClear();
    exceptionHandler?.(timeoutError);

    expect(errorSpy).toHaveBeenCalledWith('Uncaught Exception:', timeoutError);
    expect(errorSpy).toHaveBeenCalledWith('Stack:', timeoutError.stack);
    expect(errorSpy).toHaveBeenCalledWith('MongoDB connection issue detected. Continuing...');
    expect(exitSpy).not.toHaveBeenCalled();

    const criticalError = new Error('Unexpected crash');
    errorSpy.mockClear();
    exceptionHandler?.(criticalError);
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockClear();
    process.env.NODE_ENV = 'development';
    exceptionHandler?.(criticalError);
    expect(errorSpy).toHaveBeenCalledWith('Development mode: Server will continue running');
    expect(exitSpy).not.toHaveBeenCalled();
  });
});
