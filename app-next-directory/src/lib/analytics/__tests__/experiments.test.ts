const posthogMock = {
  getFeatureFlag: jest.fn(),
  capture: jest.fn(),
};

jest.mock('posthog-js', () => ({
  __esModule: true,
  default: posthogMock,
  getFeatureFlag: posthogMock.getFeatureFlag,
  capture: posthogMock.capture,
}));

describe('analytics experiments', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('returns a configured experiment by id', async () => {
    const { getExperiment } = await import('../experiments');
    expect(getExperiment('listing-cta-experiment')).toMatchObject({ name: 'Listing CTA Variant Test' });
    expect(getExperiment('unknown')).toBeUndefined();
  });

  it('selects variants from feature flags when available', async () => {
    posthogMock.getFeatureFlag.mockReturnValueOnce('variant-a');
    const { getExperiment, getExperimentVariant } = await import('../experiments');
    const experiment = getExperiment('listing-cta-experiment');
    const variant = getExperimentVariant(experiment!);
    expect(variant).toBe('variant-a');
  });

  it('activates experiments and records events', async () => {
    posthogMock.getFeatureFlag.mockReturnValueOnce(null);
    const { activateExperiment } = await import('../experiments');
    const variant = activateExperiment('listing-cta-experiment');

    expect(posthogMock.capture).toHaveBeenCalledWith('$experiment_started', {
      experiment: 'Listing CTA Variant Test',
      variant: 'Control',
    });
    expect(variant).toMatchObject({ id: 'control' });
  });
});
