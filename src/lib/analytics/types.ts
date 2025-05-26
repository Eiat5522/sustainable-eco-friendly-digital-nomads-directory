export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
}

export interface ExperimentVariant {
  id: string;
  name: string;
  weight: number;
}

export interface Experiment {
  id: string;
  name: string;
  variants: ExperimentVariant[];
}

export interface AnalyticsProvider {
  initialize(): Promise<void>;
  trackPageView(url: string): void;
  trackEvent(event: AnalyticsEvent): void;
  trackExperiment(experiment: Experiment, variant: ExperimentVariant): void;
}
