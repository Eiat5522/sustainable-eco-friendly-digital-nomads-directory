/**
 * Baseline Performance Testing Script
 * 
 * This module provides utilities for conducting baseline performance tests
 * to benchmark the application against our performance budgets.
 * 
 * @version 1.0.0
 * @date May 15, 2025
 */

import { PERFORMANCE_BUDGETS } from './performance-budgets';

/**
 * Configuration for baseline testing
 */
export const BASELINE_TEST_CONFIG = {
  // Key URLs to test
  testUrls: [
    '/', // Homepage
    '/listings', // Listings page
    '/listings/map', // Map view
    '/about', // About page
    '/contact', // Contact page
    // Add more important pages as needed
  ],
  
  // Number of times to load each page for averaging results
  iterations: 3,
  
  // Whether to run the tests with a simulated throttled connection
  useThrottling: true,
  
  // Network throttling settings (Chrome DevTools presets)
  throttling: {
    // Fast 3G
    fast3G: {
      downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
      uploadThroughput: 750 * 1024 / 8, // 750 Kbps
      latency: 40, // 40ms RTT
    },
    // Slow 3G
    slow3G: {
      downloadThroughput: 500 * 1024 / 8, // 500 Kbps
      uploadThroughput: 250 * 1024 / 8, // 250 Kbps
      latency: 300, // 300ms RTT
    }
  },
  
  // Device emulation settings
  deviceEmulation: {
    mobile: {
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      mobile: true
    },
    desktop: {
      width: 1366,
      height: 768,
      deviceScaleFactor: 1,
      mobile: false
    }
  },
  
  // API endpoints to test
  apiEndpoints: [
    { path: '/api/listings', method: 'GET', params: { page: 1, limit: 10 } },
    { path: '/api/listings/map', method: 'GET', params: { bounds: '12.34,56.78,90.12,34.56' } },
    { path: '/api/search', method: 'GET', params: { q: 'coworking', city: 'bangkok' } }
  ],
  
  // Output folder for test results
  outputDir: './test-results/performance'
};

/**
 * Generate a Lighthouse configuration based on our performance budgets
 * @returns {Object} - Lighthouse config
 */
export function generateLighthouseConfig() {
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
    // Create budgets based on our performance budgets
    budgets: [{
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
      ]
    }]
  };
}

/**
 * Structure for storing test results
 * @returns {Object} - Empty test results object
 */
export function createEmptyTestResults() {
  return {
    timestamp: Date.now(),
    date: new Date().toISOString(),
    summary: {
      pass: 0,
      warn: 0,
      fail: 0,
      total: 0
    },
    pageTests: [],
    apiTests: []
  };
}

/**
 * Evaluate a metric against its budget
 * @param {string} category - The metric category (e.g., 'pageLoad')
 * @param {string} name - The metric name (e.g., 'FCP')
 * @param {number} value - The measured value
 * @returns {Object} - Result with status and details
 */
export function evaluateMetric(category, name, value) {
  if (!PERFORMANCE_BUDGETS[category] || !PERFORMANCE_BUDGETS[category][name]) {
    return {
      status: 'unknown',
      details: `No budget defined for ${category}.${name}`
    };
  }
  
  const budget = PERFORMANCE_BUDGETS[category][name];
  
  if (value <= budget.target) {
    return {
      status: 'pass',
      details: `${value} ≤ ${budget.target} (target)`
    };
  } else if (value <= budget.acceptable) {
    return {
      status: 'warn',
      details: `${value} > ${budget.target} (target) but ≤ ${budget.acceptable} (acceptable)`
    };
  } else {
    return {
      status: 'fail',
      details: `${value} > ${budget.acceptable} (acceptable)`
    };
  }
}

/**
 * Generate a formatted report from test results
 * @param {Object} results - Test results object
 * @returns {string} - Markdown formatted report
 */
export function generateMarkdownReport(results) {
  const { timestamp, date, summary, pageTests, apiTests } = results;
  
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
        const budget = PERFORMANCE_BUDGETS[metric.category][metric.name];
        const statusEmoji = metric.result.status === 'pass' ? '✅' : 
                           metric.result.status === 'warn' ? '⚠️' : '❌';
        
        markdown += `| ${metric.category}.${metric.name} | ${metric.value} | ${budget.target} | ${budget.acceptable} | ${statusEmoji} |\n`;
      }
      
      markdown += `\n`;
    }
  }
  
  if (apiTests.length > 0) {
    markdown += `## API Tests\n\n`;
    
    markdown += `| Endpoint | Method | Response Time | Target | Acceptable | Status |\n`;
    markdown += `|----------|--------|---------------|--------|------------|---------|\n`;
    
    for (const apiTest of apiTests) {
      const { endpoint, method, responseTime, result } = apiTest;
      const name = endpoint.split('/').pop();
      const budget = PERFORMANCE_BUDGETS.apiResponses[name] || 
                     { target: 300, acceptable: 600 }; // Default if not specified
      
      const statusEmoji = result.status === 'pass' ? '✅' : 
                         result.status === 'warn' ? '⚠️' : '❌';
      
      markdown += `| ${endpoint} | ${method} | ${responseTime}ms | ${budget.target}ms | ${budget.acceptable}ms | ${statusEmoji} |\n`;
    }
  }
  
  markdown += `\n## Recommendations\n\n`;
  
  // Generate recommendations based on failures
  const failedTests = [...pageTests, ...apiTests].flatMap(test => 
    (test.metrics || [{ result: test.result }])
      .filter(metric => metric.result.status === 'fail')
      .map(metric => ({ test, metric }))
  );
  
  if (failedTests.length === 0) {
    markdown += `All tests passed or are within acceptable limits. Continue monitoring for regressions.\n`;
  } else {
    markdown += `Based on test failures, consider the following optimizations:\n\n`;
    
    for (const { test, metric } of failedTests.slice(0, 5)) { // Limit to top 5 issues
      const url = test.url || test.endpoint;
      const metricName = metric.name || (url.split('/').pop());
      
      markdown += `- **${metricName}** on \`${url}\`: ${getRecommendation(metricName)}\n`;
    }
  }
  
  return markdown;
}

/**
 * Get optimization recommendations based on the metric name
 * @param {string} metricName - Name of the metric
 * @returns {string} - Recommendation
 */
function getRecommendation(metricName) {
  const recommendations = {
    'FCP': 'Optimize server response time, reduce render-blocking resources, and optimize critical rendering path.',
    'LCP': 'Optimize largest image/text, reduce server response time, and minimize render-blocking resources.',
    'TTI': 'Reduce JavaScript execution time, minimize main thread work, and defer non-essential JavaScript.',
    'FID': 'Break up long tasks, optimize event handlers, and minimize input delay.',
    'CLS': 'Set size attributes on images/videos, ensure content has appropriate dimensions, and avoid inserting content above existing content.',
    'TBT': 'Minimize long tasks, optimize JavaScript execution, and reduce main thread work.',
    'listings': 'Optimize database queries, implement pagination, and consider caching frequently accessed listings.',
    'search': 'Optimize search algorithm, add indexes to search fields, and implement query caching.',
    'mapData': 'Implement data clustering, paginate map markers, and optimize geospatial queries.',
    'userProfile': 'Cache user data, optimize database queries, and defer loading of non-essential user data.'
  };
  
  return recommendations[metricName] || 'Review implementation and consider optimizing resource usage and response times.';
}

export default {
  BASELINE_TEST_CONFIG,
  generateLighthouseConfig,
  createEmptyTestResults,
  evaluateMetric,
  generateMarkdownReport
};
