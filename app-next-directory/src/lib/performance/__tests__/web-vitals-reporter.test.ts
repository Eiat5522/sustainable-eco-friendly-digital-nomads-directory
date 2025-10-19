import { WebVitalsReporter } from '../web-vitals-reporter';

describe('WebVitalsReporter', () => {
	const originalNavigator = (global as any).navigator;
	const originalFetch = (global as any).fetch;

	afterEach(() => {
		(global as any).navigator = originalNavigator;
		(global as any).fetch = originalFetch;
		jest.resetAllMocks();
	});

	test('uses navigator.sendBeacon when available and returns true', () => {
			const sendBeacon = jest.fn(() => true);
			(global as any).navigator = { sendBeacon };
			// ensure fetch returns a Promise so .catch exists if called unexpectedly
			(global as any).fetch = jest.fn(() => Promise.resolve({ ok: true }));

		const metric = { id: '1', name: 'CLS', value: 1 } as any;
		WebVitalsReporter(metric);

		expect(sendBeacon).toHaveBeenCalledWith(
			'/api/performance/web-vitals',
			JSON.stringify({ ...metric, entries: [] })
		);
		expect((global as any).fetch).not.toHaveBeenCalled();
	});

	test('falls back to fetch when sendBeacon unavailable or returns false', () => {
			// simulate sendBeacon not available
			(global as any).navigator = {};
			(global as any).fetch = jest.fn(() => Promise.resolve({ ok: true }));

		const metric = { id: '2', name: 'LCP', value: 2 } as any;
		WebVitalsReporter(metric);

		expect(sendBeacon).toHaveBeenCalled();
		expect((global as any).fetch).toHaveBeenCalled();
		const [url, opts] = (global as any).fetch.mock.calls[0];
		expect(url).toBe('/api/performance/web-vitals');
		expect(opts.method).toBe('POST');
	});
});
