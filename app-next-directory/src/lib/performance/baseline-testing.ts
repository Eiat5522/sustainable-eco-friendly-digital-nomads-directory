/**
 * Baseline Performance Testing Utilities
 *
 * Provides configuration and helpers for benchmarking the application against
 * the established performance budgets.
 */
import { PERFORMANCE_BUDGETS } from './performance-budgets';

export type MetricStatus = 'pass' | 'warn' | 'fail' | 'unknown';

export type MetricEvaluation = {
  status: MetricStatus;
  details: string;
};

export type PageMetric = {
  category: string;
  name: string;
  value: number;
  result: MetricEvaluation;
};

export type PageTestResult = {
  url: string;
  metrics: PageMetric[];
};

export type ApiEndpoint = {
  path: string;
  method: string;
  params?: Record<string, unknown>;
};

export type ApiTestResult = {
  endpoint: string;
  method: string;
  responseTime: number;
  result: MetricEvaluation;
};

export type BaselineTestSummary = {
  pass: number;
  warn: number;
  fail: number;
  total: number;
};

export type BaselineTestResults = {
  timestamp: number;
  date: string;
  summary: BaselineTestSummary;
  pageTests: PageTestResult[];
  apiTests: ApiTestResult[];
};

type ThrottlingPreset = {
  downloadThroughput: number;
  uploadThroughput: number;
  latency: number;
};

type DeviceEmulationConfig = {
  width: number;
  height: number;
  deviceScaleFactor: number;
  mobile: boolean;
};

export type BaselineTestConfig = {
  testUrls: string[];
  iterations: number;
  useThrottling: boolean;
  throttling: {
    fast3G: ThrottlingPreset;
    slow3G: ThrottlingPreset;
  };
  deviceEmulation: {
    mobile: DeviceEmulationConfig;
    desktop: DeviceEmulationConfig;
  };
  apiEndpoints: ApiEndpoint[];
  outputDir: string;
};

export const BASELINE_TEST_CONFIG: BaselineTestConfig = {
  testUrls: ['/', '/listings', '/listings/map', '/about', '/contact'],
  iterations: 3,
  useThrottling: true,
  throttling: {
    fast3G: {
      downloadThroughput: (1.5 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
      latency: 40,
    },
    slow3G: {
      downloadThroughput: (500 * 1024) / 8,
      uploadThroughput: (250 * 1024) / 8,
      latency: 300,
    },
  },
  deviceEmulation: {
    mobile: {
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      mobile: true,
    },
    desktop: {
      width: 1366,
      height: 768,
      deviceScaleFactor: 1,
      mobile: false,
    },
  },
  apiEndpoints: [
    { path: '/api/listings', method: 'GET', params: { page: 1, limit: 10 } },
    { path: '/api/listings/map', method: 'GET', params: { bounds: '12.34,56.78,90.12,34.56' } },
    { path: '/api/search', method: 'GET', params: { q: 'coworking', city: 'bangkok' } },
  ],
  outputDir: './test-results/performance',
};

export function generateLighthouseConfig(): Record<string, unknown> {
  return {
    extends: 'lighthouse:default',
    settings: {
      formFactor: 'desktop',
      throttling: BASELINE_TEST_CONFIG.throttling.fast3G,
      screenEmulation: BASELINE_TEST_CONFIG.deviceEmulation.desktop,
      onlyCategories: ['performance'],
    },
    audits: [
      'metrics/first-contentful-paint',
      'metrics/largest-contentful-paint',
      'metrics/total-blocking-time',
      'metrics/cumulative-layout-shift',
      'metrics/interactive',
      'metrics/first-meaningful-paint',
      'metrics/max-potential-fid',
      'server-response-time',
      'resource-summary',
    ],
    budgets: [
      {
        path: '/',
        resourceSizes: [
          { resourceType: 'total', budget: PERFORMANCE_BUDGETS.resourceSize.total.acceptable * 1024 },
          { resourceType: 'script', budget: PERFORMANCE_BUDGETS.resourceSize.javascript.acceptable * 1024 },
          { resourceType: 'image', budget: PERFORMANCE_BUDGETS.resourceSize.images.acceptable * 1024 },
          { resourceType: 'stylesheet', budget: PERFORMANCE_BUDGETS.resourceSize.css.acceptable * 1024 },
          { resourceType: 'font', budget: PERFORMANCE_BUDGETS.resourceSize.fonts.acceptable * 1024 },
        ],
        timings: [
          { metric: 'first-contentful-paint', budget: PERFORMANCE_BUDGETS.pageLoad.FCP.acceptable },
          { metric: 'largest-contentful-paint', budget: PERFORMANCE_BUDGETS.pageLoad.LCP.acceptable },
          { metric: 'interactive', budget: PERFORMANCE_BUDGETS.pageLoad.TTI.acceptable },
          { metric: 'total-blocking-time', budget: PERFORMANCE_BUDGETS.pageLoad.TBT.acceptable },
        ],
      },
    ],
  };
}

export function createEmptyTestResults(): BaselineTestResults {
  return {
    timestamp: Date.now(),
    date: new Date().toISOString(),
    summary: {
      pass: 0,
      warn: 0,
      fail: 0,
      total: 0,
    },
    pageTests: [],
    apiTests: [],
  };
}

export function evaluateMetric(category: string, name: string, value: number): MetricEvaluation {
  const categoryBudgets = (PERFORMANCE_BUDGETS as Record<string, Record<string, { target: number; acceptable: number }>>)[category];
  const budget = categoryBudgets?.[name];

  if (!budget) {
    return {
      status: 'unknown',
      details: `No budget defined for ${category}.${name}`,
    };
  }

  if (value <= budget.target) {
    return {
      status: 'pass',
      details: `${value} ≤ ${budget.target} (target)`,
    };
  }

  if (value <= budget.acceptable) {
    return {
      status: 'warn',
      details: `${value} > ${budget.target} (target) but ≤ ${budget.acceptable} (acceptable)`,
    };
  }

  return {
    status: 'fail',
    details: `${value} > ${budget.acceptable} (acceptable)`,
  };
}

export function generateMarkdownReport(results: BaselineTestResults): string {
  const { date, summary, pageTests, apiTests } = results;

  let markdown = `# Performance Baseline Test Results\n\n`;
  markdown += `Generated: ${date}\n\n`;

  markdown += `## Summary\n\n`;
  markdown += `- **Pass:** ${summary.pass}\n`;
  markdown += `- **Warnings:** ${summary.warn}\n`;
  markdown += `- **Failures:** ${summary.fail}\n`;
  markdown += `- **Total Tests:** ${summary.total}\n\n`;

  if (pageTests.length > 0) {
    markdown += `## Page Tests\n\n`;

    for (const pageTest of pageTests) {
      markdown += `### ${pageTest.url}\n\n`;
      markdown += `| Metric | Value | Target | Acceptable | Status |\n`;
      markdown += `|--------|-------|--------|------------|---------|\n`;

      for (const metric of pageTest.metrics) {
        const budget =
          (PERFORMANCE_BUDGETS as Record<string, Record<string, { target: number; acceptable: number }>>)[
            metric.category
          ]?.[metric.name];
        const statusEmoji =
          metric.result.status === 'pass'
            ? '✅'
            : metric.result.status === 'warn'
            ? '⚠️'
            : metric.result.status === 'fail'
            ? '❌'
            : 'ℹ️';

        markdown += `| ${metric.category}.${metric.name} | ${metric.value} | ${budget?.target ?? 'N/A'} | ${
          budget?.acceptable ?? 'N/A'
        } | ${statusEmoji} |\n`;
      }

      markdown += `\n`;
    }
  }

  if (apiTests.length > 0) {
    markdown += `## API Tests\n\n`;
    markdown += `| Endpoint | Method | Response Time | Target | Acceptable | Status |\n`;
    markdown += `|----------|--------|---------------|--------|------------|---------|\n`;

    for (const apiTest of apiTests) {
      const name = apiTest.endpoint.split('/').pop() ?? '';
      const budget =
        PERFORMANCE_BUDGETS.apiResponses[name as keyof typeof PERFORMANCE_BUDGETS.apiResponses] ?? {
          target: 300,
          acceptable: 600,
        };

      const statusEmoji =
        apiTest.result.status === 'pass'
          ? '✅'
          : apiTest.result.status === 'warn'
          ? '⚠️'
          : apiTest.result.status === 'fail'
          ? '❌'
          : 'ℹ️';

      markdown += `| ${apiTest.endpoint} | ${apiTest.method} | ${apiTest.responseTime}ms | ${budget.target}ms | ${budget.acceptable}ms | ${statusEmoji} |\n`;
    }
  }

  markdown += `\n## Recommendations\n\n`;

  const failedMetrics = [
    ...pageTests.flatMap((test) =>
      test.metrics.filter((metric) => metric.result.status === 'fail').map((metric) => ({ test, metric }))
    ),
    ...apiTests
      .filter((test) => test.result.status === 'fail')
      .map((test) => ({ test, metric: { name: test.endpoint.split('/').pop() ?? '', result: test.result } })),
  ];

  if (failedMetrics.length === 0) {
    markdown += `All tests passed or are within acceptable limits. Continue monitoring for regressions.\n`;
  } else {
    markdown += `Based on test failures, consider the following optimizations:\n\n`;

    for (const { test, metric } of failedMetrics.slice(0, 5)) {
      const url = 'url' in test ? test.url : test.endpoint;
      const metricName = metric.name || url.split('/').pop() || 'metric';
      markdown += `- **${metricName}** on \`${url}\`: ${getRecommendation(metricName)}\n`;
    }
  }

  return markdown;
}

function getRecommendation(metricName: string): string {
  const recommendations: Record<string, string> = {
    FCP: 'Optimize server response time, reduce render-blocking resources, and optimise the critical rendering path.',
    LCP: 'Optimise the largest image or text, reduce server response time, and minimise render-blocking resources.',
    TTI: 'Reduce JavaScript execution time, minimise main thread work, and defer non-essential JavaScript.',
    FID: 'Break up long tasks, optimise event handlers, and minimise input delay.',
    CLS: 'Set size attributes on media, reserve space for dynamic content, and avoid layout shifts during load.',
    TBT: 'Minimise long tasks, optimise JavaScript execution, and reduce main thread work.',
    listings: 'Optimise database queries, implement pagination, and cache frequently accessed listings.',
    search: 'Optimise search algorithms, add indexes to search fields, and implement query caching.',
    mapData: 'Implement data clustering, paginate map markers, and optimise geospatial queries.',
    userProfile: 'Cache user data, optimise database queries, and defer loading of non-essential user data.',
  };

  return recommendations[metricName] || 'Review the implementation and optimise resource usage and response times.';
}

export default {
  BASELINE_TEST_CONFIG,
  generateLighthouseConfig,
  createEmptyTestResults,
  evaluateMetric,
  generateMarkdownReport,
};
