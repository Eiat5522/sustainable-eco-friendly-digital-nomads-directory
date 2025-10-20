import {
  API_MONITORING_CONFIG,
  MONITORING_CONFIG,
  RESOURCE_SIZE_CONFIG,
  SERVER_TIMING_CONFIG,
  WEB_VITALS_CONFIG,
} from '../monitoring-config';

describe('monitoring-config', () => {
  it('exposes web vitals thresholds derived from performance budgets', () => {
    expect(WEB_VITALS_CONFIG.thresholds).toMatchObject({
      FCP: expect.any(Number),
      LCP: expect.any(Number),
      CLS: expect.any(Number),
    });
    expect(WEB_VITALS_CONFIG.metrics).toEqual(
      expect.arrayContaining(['FCP', 'LCP', 'CLS', 'FID', 'TTFB', 'INP'])
    );
  });

  it('configures server timing and api monitoring settings', () => {
    expect(SERVER_TIMING_CONFIG.operations).toEqual(
      expect.arrayContaining(['database-query', 'render-time'])
    );
    expect(API_MONITORING_CONFIG.endpoints.listings.threshold).toBeGreaterThan(0);
  });

  it('makes resource size thresholds available for bundle monitoring', () => {
    expect(RESOURCE_SIZE_CONFIG.thresholds).toMatchObject({
      javascript: expect.any(Number),
      images: expect.any(Number),
      total: expect.any(Number),
    });
  });

  it('provides a top-level configuration aggregate', () => {
    expect(MONITORING_CONFIG.webVitals).toBe(WEB_VITALS_CONFIG);
    expect(MONITORING_CONFIG.serverTiming).toBe(SERVER_TIMING_CONFIG);
    expect(MONITORING_CONFIG.apiMonitoring).toBe(API_MONITORING_CONFIG);
    expect(MONITORING_CONFIG.resourceSize).toBe(RESOURCE_SIZE_CONFIG);
  });
});
