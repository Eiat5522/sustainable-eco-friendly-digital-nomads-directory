import { render, screen } from '@testing-library/react';
import { PlausibleAnalyticsProvider } from '../provider';
import * as plausible from '../index';
import { AnalyticsProvider } from '../../AnalyticsProvider';

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
    render(
      <AnalyticsProvider>
        <span>Analytics child</span>
      </AnalyticsProvider>
    );

    expect(screen.getByText('Analytics child')).toBeInTheDocument();
  });
});
