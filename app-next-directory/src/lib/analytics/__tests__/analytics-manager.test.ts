const mockPosthog = {
  init: jest.fn(),
  capture: jest.fn(),
  debug: jest.fn(),
};

jest.mock('posthog-js', () => ({
  __esModule: true,
  default: mockPosthog,
  init: mockPosthog.init,
  capture: mockPosthog.capture,
  debug: mockPosthog.debug,
}));

describe('AnalyticsManager', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
  });

  it('does not track events before initialization', async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'key';
    const analyticsModule = await import('../analytics');
    const { analytics } = analyticsModule;

    analytics.trackPageView('/early');
    analytics.trackEvent({ name: 'uninitialized' });

    expect(mockPosthog.capture).not.toHaveBeenCalled();
  });

  it('reuses the singleton instance and skips experiment tracking before init', async () => {
    const analyticsModule = await import('../analytics');
    const { analytics } = analyticsModule;

    const again = (analytics.constructor as any).getInstance();
    expect(again).toBe(analytics);

    analytics.trackExperiment(
      { id: 'exp', name: 'Experiment', variants: [{ id: 'control', name: 'Control', weight: 100 }] },
      { id: 'control', name: 'Control', weight: 100 }
    );

    expect(mockPosthog.capture).not.toHaveBeenCalled();
  });

  it('initializes PostHog once and tracks events', async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'test-key';
    process.env.NEXT_PUBLIC_POSTHOG_HOST = 'https://example.com';

    const analyticsModule = await import('../analytics');
    const { analytics } = analyticsModule;

    await analytics.initialize();
    await analytics.initialize();

    expect(mockPosthog.init).toHaveBeenCalledTimes(1);
    expect(mockPosthog.init).toHaveBeenCalledWith('test-key', {
      api_host: 'https://example.com',
      loaded: expect.any(Function),
    });

    analytics.trackPageView('/dashboard');
    analytics.trackEvent({ name: 'test-event', properties: { foo: 'bar' } });
    analytics.trackExperiment(
      { id: 'exp', name: 'Experiment', variants: [{ id: 'control', name: 'Control', weight: 100 }] },
      { id: 'control', name: 'Control', weight: 100 }
    );

    expect(mockPosthog.capture).toHaveBeenCalledWith('$pageview', { url: '/dashboard' });
    expect(mockPosthog.capture).toHaveBeenCalledWith('test-event', { foo: 'bar' });
    expect(mockPosthog.capture).toHaveBeenCalledWith('$experiment_started', {
      experiment: 'Experiment',
      variant: 'Control',
    });
  });

  it('skips PostHog initialization when key is missing', async () => {
    const analyticsModule = await import('../analytics');
    const { analytics } = analyticsModule;

    await analytics.initialize();
    expect(mockPosthog.init).not.toHaveBeenCalled();
  });

  it('uses default host and triggers debug callback in development', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'dev-key';

    const analyticsModule = await import('../analytics');
    const { analytics } = analyticsModule;

    await analytics.initialize();

    const [, options] = mockPosthog.init.mock.calls[0];
    expect(options).toMatchObject({ api_host: 'https://app.posthog.com', loaded: expect.any(Function) });

    options.loaded?.({ debug: mockPosthog.debug } as any);
    expect(mockPosthog.debug).toHaveBeenCalled();

    process.env.NODE_ENV = originalNodeEnv;
  });
});
