import PostHog from 'posthog-js';
import { type Experiment, type ExperimentVariant } from './types';

const experiments: Experiment[] = [
  {
    id: 'listing-cta-experiment',
    name: 'Listing CTA Variant Test',
    variants: [
      { id: 'control', name: 'Control', weight: 50 },
      { id: 'variant-a', name: 'Variant A', weight: 25 },
      { id: 'variant-b', name: 'Variant B', weight: 25 },
    ],
  },
  // Add more experiments here
];

export function getExperiment(experimentId: string): Experiment | undefined {
  return experiments.find((exp) => exp.id === experimentId);
}

export function getExperimentVariant(experiment: Experiment): ExperimentVariant {
  const defaultVariant = experiment.variants[0];
  if (!defaultVariant) {
    throw new Error(`Experiment ${experiment.id} has no variants configured`);
  }

  const flag = PostHog.getFeatureFlag(experiment.id);
  if (typeof flag === 'string') {
    const matchingVariant = experiment.variants.find((variant) => variant.id === flag);
    if (matchingVariant) {
      return matchingVariant;
    }
  }

  return defaultVariant;
}

export function activateExperiment(experimentId: string): ExperimentVariant | null {
  const experiment = getExperiment(experimentId);
  if (!experiment) return null;

  const variant = getExperimentVariant(experiment);
  PostHog.capture('$experiment_started', {
    experiment: experiment.name,
    variant: variant.name,
  });

  return variant;
}
