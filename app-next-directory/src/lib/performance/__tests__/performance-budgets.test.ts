import {
  evaluatePerformanceMetric,
  getMetricThresholds,
  PERFORMANCE_BUDGETS,
} from '../performance-budgets';

describe('performance-budgets', () => {
  it('exposes the static performance budget map', () => {
    expect(PERFORMANCE_BUDGETS.pageLoad.FCP).toEqual({
      target: 1500,
      acceptable: 2500,
      critical: 3500,
    });
  });

  describe('evaluatePerformanceMetric', () => {
    it('returns thresholds for non-CLS metrics', () => {
      expect(evaluatePerformanceMetric('pageLoad', 'FCP', 1400)).toBe('good');
      expect(evaluatePerformanceMetric('pageLoad', 'FCP', 2000)).toBe('needs-improvement');
      expect(evaluatePerformanceMetric('pageLoad', 'FCP', 3600)).toBe('poor');
    });

    it('applies CLS specific thresholds with fractional comparisons', () => {
      expect(evaluatePerformanceMetric('pageLoad', 'CLS', 0.09)).toBe('good');
      expect(evaluatePerformanceMetric('pageLoad', 'CLS', 0.2)).toBe('needs-improvement');
      expect(evaluatePerformanceMetric('pageLoad', 'CLS', 0.6)).toBe('poor');
    });

    it('returns unknown for missing categories or metrics', () => {
      expect(evaluatePerformanceMetric('unknownCategory', 'metric', 100)).toBe('unknown');
      expect(evaluatePerformanceMetric('pageLoad', 'unknownMetric', 100)).toBe('unknown');
    });
  });

  describe('getMetricThresholds', () => {
    it('returns the matching thresholds when the metric is known', () => {
      const thresholds = getMetricThresholds('resourceSize', 'javascript');

      expect(thresholds).toEqual({
        target: 350,
        acceptable: 500,
        critical: 700,
      });
    });

    it('returns null when the metric is missing', () => {
      expect(getMetricThresholds('invalidCategory', 'metric')).toBeNull();
      expect(getMetricThresholds('resourceSize', 'invalidMetric')).toBeNull();
    });
  });
});
