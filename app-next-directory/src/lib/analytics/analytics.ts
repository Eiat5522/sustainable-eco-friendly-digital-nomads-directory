import { Analytics } from '@vercel/analytics/react';
import PostHog from 'posthog-js';
import { type AnalyticsEvent, type Experiment, type ExperimentVariant } from './types';

class AnalyticsManager {
  private static instance: AnalyticsManager;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): AnalyticsManager {
    if (!AnalyticsManager.instance) {
      AnalyticsManager.instance = new AnalyticsManager();
    }
    return AnalyticsManager.instance;
  }

  public async initialize() {
    if (this.isInitialized) return;

    // Initialize PostHog for A/B testing
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      PostHog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') posthog.debug();
        },
      });
    }

    this.isInitialized = true;
  }

  public trackPageView(url: string) {
    if (!this.isInitialized) return;

    // Track in PostHog
    PostHog.capture('$pageview', { url });
  }

  public trackEvent(event: AnalyticsEvent) {
    if (!this.isInitialized) return;

    // Track in PostHog
    PostHog.capture(event.name, event.properties);
  }

  public trackExperiment(experiment: Experiment, variant: ExperimentVariant) {
    if (!this.isInitialized) return;

    // Track experiment in PostHog
    PostHog.capture('$experiment_started', {
      experiment: experiment.name,
      variant: variant.name,
    });
  }
}

export const analytics = AnalyticsManager.getInstance();
