import {
  BASELINE_TEST_CONFIG,
  createEmptyTestResults,
  evaluateMetric,
  generateLighthouseConfig,
  generateMarkdownReport,
} from '../baseline-testing';

describe('baseline-testing utilities', () => {
  it('exposes a baseline test configuration with expected defaults', () => {
    expect(BASELINE_TEST_CONFIG.testUrls).toContain('/');
    expect(BASELINE_TEST_CONFIG.iterations).toBe(3);
    expect(BASELINE_TEST_CONFIG.useThrottling).toBe(true);
    expect(BASELINE_TEST_CONFIG.apiEndpoints).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: '/api/listings', method: 'GET' })])
    );
  });

  it('creates an empty test results object with zeroed summary counts', () => {
    const results = createEmptyTestResults();
    expect(results.summary).toEqual({ pass: 0, warn: 0, fail: 0, total: 0 });
    expect(results.pageTests).toHaveLength(0);
    expect(results.apiTests).toHaveLength(0);
  });

  it('evaluates metrics against configured budgets', () => {
    expect(evaluateMetric('pageLoad', 'FCP', 1400).status).toBe('pass');
    expect(evaluateMetric('pageLoad', 'FCP', 2000).status).toBe('warn');
    expect(evaluateMetric('pageLoad', 'FCP', 4000).status).toBe('fail');
  });

  it('generates a lighthouse config mapped to performance budgets', () => {
    const config = generateLighthouseConfig();
    const budget = (config.budgets as any[])[0];

    expect(config.settings?.onlyCategories).toContain('performance');
    expect(budget.resourceSizes).toEqual(
      expect.arrayContaining([expect.objectContaining({ resourceType: 'total' })])
    );
    expect(budget.timings).toEqual(
      expect.arrayContaining([expect.objectContaining({ metric: 'largest-contentful-paint' })])
    );
  });

  it('produces a readable markdown report for collected results', () => {
    const markdown = generateMarkdownReport({
      timestamp: 0,
      date: '2025-05-15T00:00:00.000Z',
      summary: { pass: 1, warn: 1, fail: 1, total: 3 },
      pageTests: [
        {
          url: '/',
          metrics: [
            {
              category: 'pageLoad',
              name: 'FCP',
              value: 2600,
              result: { status: 'warn', details: 'Above target' },
            },
          ],
        },
      ],
      apiTests: [
        {
          endpoint: '/api/listings',
          method: 'GET',
          responseTime: 800,
          result: { status: 'fail', details: 'Too slow' },
        },
      ],
    });

    expect(markdown).toContain('# Performance Baseline Test Results');
    expect(markdown).toContain('## Summary');
    expect(markdown).toContain('| /api/listings | GET | 800ms |');
    expect(markdown).toContain('Based on test failures');
  });
});
