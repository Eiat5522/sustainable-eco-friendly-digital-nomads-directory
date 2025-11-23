import { render, screen } from '@testing-library/react';
import * as plausible from '../index';
import { PlausibleAnalyticsProvider } from '../provider';

describe('PlausibleAnalyticsProvider', () => {
  it('renders children without modification', () => {
    render(
      <PlausibleAnalyticsProvider>
        <div>Child content</div>
      </PlausibleAnalyticsProvider>
    );

    expect(screen.getByText('Child content')).toBeInTheDocument();
    expect(plausible.ANALYTICS_EVENTS.LISTING).toBe('listing_interaction');
  });
});

describe('AnalyticsProvider', () => {
  it('acts as a passthrough wrapper', () => {
    const { AnalyticsProvider } = require('../../analytics.tsx');
    render(
      <AnalyticsProvider>
        <span>Analytics child</span>
      </AnalyticsProvider>
    );

    expect(screen.getByText('Analytics child')).toBeInTheDocument();
  });
});
