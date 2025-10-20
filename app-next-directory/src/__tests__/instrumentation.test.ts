/**
 * @jest-environment node
 */

import { jest } from '@jest/globals';

type Handler = (...args: unknown[]) => void;

const originalNodeEnv = process.env.NODE_ENV;
const originalNextRuntime = process.env.NEXT_RUNTIME;

const restoreEnv = () => {
	if (originalNodeEnv === undefined) {
		delete process.env.NODE_ENV;
	} else {
		process.env.NODE_ENV = originalNodeEnv;
	}

	if (originalNextRuntime === undefined) {
		delete process.env.NEXT_RUNTIME;
	} else {
		process.env.NEXT_RUNTIME = originalNextRuntime;
	}
};

const captureProcessHandlers = () => {
	const handlers = new Map<string, Handler>();
	const onSpy = jest.spyOn(process, 'on').mockImplementation(
		((event: string, handler: Handler) => {
			handlers.set(event, handler);
			return process;
		}) as unknown as typeof process.on,
	);

	return { handlers, onSpy };
};

beforeEach(() => {
	jest.resetModules();
});

afterEach(() => {
	restoreEnv();
	jest.restoreAllMocks();
});

describe('instrumentation register()', () => {
	it('registers process listeners when running on the Node.js runtime', async () => {
		process.env.NEXT_RUNTIME = 'nodejs';

		const { handlers } = captureProcessHandlers();
		jest.spyOn(console, 'log').mockImplementation(() => undefined);
		jest.spyOn(console, 'error').mockImplementation(() => undefined);

		const { register } = await import('../instrumentation');
		await register();

		expect(handlers.get('unhandledRejection')).toEqual(expect.any(Function));
		expect(handlers.get('uncaughtException')).toEqual(expect.any(Function));
	});

	it('does not register handlers when not running on the Node.js runtime', async () => {
		process.env.NEXT_RUNTIME = 'edge';

		const { onSpy } = captureProcessHandlers();
		jest.spyOn(console, 'log').mockImplementation(() => undefined);
		jest.spyOn(console, 'error').mockImplementation(() => undefined);

		const { register } = await import('../instrumentation');
		await register();

		expect(onSpy).not.toHaveBeenCalled();
	});

	it('keeps the process alive for MongoDB errors and only exits on critical errors in production', async () => {
		process.env.NEXT_RUNTIME = 'nodejs';
		process.env.NODE_ENV = 'production';

		const { handlers } = captureProcessHandlers();
		jest.spyOn(console, 'log').mockImplementation(() => undefined);
		jest.spyOn(console, 'error').mockImplementation(() => undefined);

		const exitSpy = jest
			.spyOn(process, 'exit')
			.mockImplementation(((code?: number) => undefined) as unknown as typeof process.exit);

		const { register } = await import('../instrumentation');
		await register();

		const uncaughtHandler = handlers.get('uncaughtException');
		expect(uncaughtHandler).toEqual(expect.any(Function));

		const mongoError = new Error('MongoServerSelectionError: timed out');
		uncaughtHandler?.(mongoError);
		expect(exitSpy).not.toHaveBeenCalled();

		exitSpy.mockClear();
		process.env.NODE_ENV = 'development';

		const runtimeError = new Error('Unexpected failure');
		uncaughtHandler?.(runtimeError);
		expect(exitSpy).not.toHaveBeenCalled();

		exitSpy.mockClear();
		process.env.NODE_ENV = 'production';

		uncaughtHandler?.(runtimeError);
		expect(exitSpy).toHaveBeenCalledWith(1);
	});
});
