import { useEffect, useState } from 'react';
import { activateExperiment } from './experiments';
import type { ExperimentVariant } from './types';

export function useExperiment(experimentId: string) {
  const [variant, setVariant] = useState<ExperimentVariant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadExperiment = async () => {
      try {
        const experimentVariant = activateExperiment(experimentId);
        setVariant(experimentVariant);
      } catch (error) {
        console.error('Failed to load experiment:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExperiment();
  }, [experimentId]);

  return {
    variant,
    isLoading,
    isControl: variant?.id === 'control',
    isVariantA: variant?.id === 'variant-a',
    isVariantB: variant?.id === 'variant-b',
  };
}
