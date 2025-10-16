import { renderHook, waitFor } from '@testing-library/react';
import { useExperiment } from '../useExperiment';

const activateExperimentMock = jest.fn();

jest.mock('../experiments', () => ({
  activateExperiment: (...args: unknown[]) => activateExperimentMock(...args),
}));

describe('useExperiment hook', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('loads experiment variants and exposes helpers', async () => {
    activateExperimentMock.mockReturnValue({ id: 'variant-a', name: 'Variant A', weight: 50 });

    const { result } = renderHook(() => useExperiment('listing-cta-experiment'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(activateExperimentMock).toHaveBeenCalledWith('listing-cta-experiment');
    expect(result.current.variant).toMatchObject({ id: 'variant-a' });
    expect(result.current.isControl).toBe(false);
    expect(result.current.isVariantA).toBe(true);
    expect(result.current.isVariantB).toBe(false);
  });

  it('handles activation failures gracefully', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    activateExperimentMock.mockImplementation(() => {
      throw new Error('failed');
    });

    const { result } = renderHook(() => useExperiment('listing-cta-experiment'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.variant).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith('Failed to load experiment:', expect.any(Error));

    errorSpy.mockRestore();
  });
});
