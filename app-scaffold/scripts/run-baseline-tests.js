#!/usr/bin/env node

/**
 * Performance Baseline Testing Runner
 * 
 * This script runs baseline performance tests against the application
 * to establish initial benchmarks and validate monitoring setup.
 * 
 * Usage: node run-baseline-tests.js [--env=<environment>] [--output=<output-file>]
 * 
 * @version 1.0.0
 * @date May 15, 2025
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const fetch = require('node-fetch');
const { BASELINE_TEST_CONFIG, generateLighthouseConfig, createEmptyTestResults, evaluateMetric, generateMarkdownReport } = require('../src/lib/performance/baseline-testing');
const { PERFORMANCE_BUDGETS } = require('../src/lib/performance/performance-budgets');

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const match = arg.match(/^--([^=]+)=(.+)$/);
  if (match) {
    acc[match[1]] = match[2];
  }
  return acc;
}, {});

// Environment configuration
const ENV_CONFIG = {
  development: {
    baseUrl: 'http://localhost:3000',
    apiBaseUrl: 'http://localhost:3000/api'
  },
  staging: {
    baseUrl: 'https://staging.sustainablenomads.com',
    apiBaseUrl: 'https://staging.sustainablenomads.com/api'
  },
  production: {
    baseUrl: 'https://sustainablenomads.com',
    apiBaseUrl: 'https://sustainablenomads.com/api'
  }
};

// Get environment from args or default to development
const environment = args.env || 'development';
const config = ENV_CONFIG[environment];

if (!config) {
  console.error(`Unknown environment: ${environment}. Available environments: ${Object.keys(ENV_CONFIG).join(', ')}`);
  process.exit(1);
}

// Output file path
const outputFile = args.output || `performance-baseline-${environment}-${new Date().toISOString().slice(0, 10)}.md`;
const outputPath = path.join(__dirname, '..', 'test-results', 'performance', outputFile);

// Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Main function to run the tests
 */
async function runBaselineTests() {
  console.log(`Running baseline performance tests against ${environment} environment...`);
  console.log(`Base URL: ${config.baseUrl}`);
  
  const results = createEmptyTestResults();
  results.environment = environment;
  results.baseUrl = config.baseUrl;
  
  try {
    // Launch browser for page tests
    const browser = await puppeteer.launch({
      headless: 'new', // Use new headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    
    // Run page tests
    console.log(`\nRunning page tests...`);
    for (const urlPath of BASELINE_TEST_CONFIG.testUrls) {
      const url = new URL(urlPath, config.baseUrl).href;
      console.log(`  Testing ${url}...`);
      
      await runPageTest(browser, url, results);
    }
    
    await browser.close();
    
    // Run API tests
    console.log(`\nRunning API tests...`);
    for (const endpoint of BASELINE_TEST_CONFIG.apiEndpoints) {
      const url = new URL(endpoint.path, config.apiBaseUrl).href;
      console.log(`  Testing ${url}...`);
      
      await runApiTest(endpoint, results);
    }
    
    // Update summary stats
    results.summary.total = results.pageTests.length + results.apiTests.length;
    
    // Calculate pass/warn/fail counts
    const allTests = [
      ...results.pageTests.flatMap(test => test.metrics.map(m => m.result.status)),
      ...results.apiTests.map(test => test.result.status)
    ];
    
    results.summary.pass = allTests.filter(status => status === 'pass').length;
    results.summary.warn = allTests.filter(status => status === 'warn').length;
    results.summary.fail = allTests.filter(status => status === 'fail').length;
    
    // Generate report
    const report = generateMarkdownReport(results);
    
    // Save report to file
    fs.writeFileSync(outputPath, report);
    
    console.log(`\nTests completed successfully.`);
    console.log(`Results: ${results.summary.pass} passed, ${results.summary.warn} warnings, ${results.summary.fail} failed`);
    console.log(`Report saved to: ${outputPath}`);
    
    // Save raw results as JSON for future reference
    fs.writeFileSync(
      outputPath.replace('.md', '.json'), 
      JSON.stringify(results, null, 2)
    );
    
    // Exit with non-zero code if there are failures
    process.exit(results.summary.fail > 0 ? 1 : 0);
  } catch (error) {
    console.error(`Error running baseline tests:`, error);
    process.exit(1);
  }
}

/**
 * Run performance tests for a page
 * @param {Browser} browser - Puppeteer browser instance
 * @param {string} url - URL to test
 * @param {Object} results - Results object to update
 */
async function runPageTest(browser, url, results) {
  try {
    // Create a new page
    const page = await browser.newPage();
    
    // Collect performance metrics
    const pageMetrics = {};
    
    // Set up performance observer
    await page.evaluateOnNewDocument(() => {
      window.performanceMetrics = {};
      
      // Create a PerformanceObserver to collect key metrics
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Store each performance entry by name
          window.performanceMetrics[entry.name] = entry;
        }
      });
      
      // Observe all performance entry types
      observer.observe({ 
        entryTypes: ['navigation', 'resource', 'paint', 'mark', 'measure', 'longtask']
      });
    });
    
    // Navigate to the page
    const response = await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });
    
    if (!response || !response.ok()) {
      throw new Error(`Failed to load ${url}: ${response ? response.status() : 'No response'}`);
    }
    
    // Get collected metrics
    const metrics = await page.evaluate(() => window.performanceMetrics);
    
    // Get navigation timing metrics
    const navTiming = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      return {
        TTFB: nav.responseStart - nav.requestStart,
        DOMContentLoaded: nav.domContentLoadedEventEnd - nav.fetchStart,
        Load: nav.loadEventEnd - nav.fetchStart,
      };
    });
    
    // Get Lighthouse performance score (optional)
    let lighthouseResults = null;
    try {
      const config = generateLighthouseConfig();
      const { lhr } = await lighthouse(url, {
        port: (new URL(browser.wsEndpoint())).port,
        output: 'json',
        logLevel: 'error',
      }, config);
      
      lighthouseResults = {
        score: lhr.categories.performance.score * 100,
        FCP: lhr.audits['first-contentful-paint'].numericValue,
        LCP: lhr.audits['largest-contentful-paint'].numericValue,
        TBT: lhr.audits['total-blocking-time'].numericValue,
        CLS: lhr.audits['cumulative-layout-shift'].numericValue,
        TTI: lhr.audits['interactive'].numericValue
      };
    } catch (error) {
      console.warn(`  Failed to run Lighthouse: ${error.message}`);
    }
    
    // Close the page
    await page.close();
    
    // Create a page test result
    const pageTest = {
      url,
      timestamp: Date.now(),
      metrics: []
    };
    
    // Add navigation timing metrics
    for (const [name, value] of Object.entries(navTiming)) {
      const result = evaluateMetric('pageLoad', name, value);
      pageTest.metrics.push({
        category: 'pageLoad',
        name,
        value,
        result
      });
      
      console.log(`    ${name}: ${value}ms - ${result.status.toUpperCase()}`);
    }
    
    // Add Lighthouse metrics if available
    if (lighthouseResults) {
      for (const [name, value] of Object.entries(lighthouseResults)) {
        if (name === 'score') continue; // Skip the overall score
        
        const result = evaluateMetric('pageLoad', name, value);
        pageTest.metrics.push({
          category: 'pageLoad',
          name,
          value,
          result
        });
        
        console.log(`    ${name}: ${value}${name === 'CLS' ? '' : 'ms'} - ${result.status.toUpperCase()}`);
      }
      
      pageTest.lighthouseScore = lighthouseResults.score;
    }
    
    // Add to results
    results.pageTests.push(pageTest);
  } catch (error) {
    console.error(`  Error testing ${url}:`, error);
    
    // Add a failed test result
    results.pageTests.push({
      url,
      timestamp: Date.now(),
      error: error.message,
      metrics: []
    });
  }
}

/**
 * Run performance tests for an API endpoint
 * @param {Object} endpoint - API endpoint configuration
 * @param {Object} results - Results object to update
 */
async function runApiTest(endpoint, results) {
  try {
    const { path, method, params } = endpoint;
    const name = path.split('/').pop();
    
    // Build URL with query params if provided
    let url = new URL(path, config.apiBaseUrl);
    if (params && method === 'GET') {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    
    // Prepare request
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    // Add body for POST/PUT/PATCH requests
    if (params && method !== 'GET' && method !== 'DELETE') {
      options.body = JSON.stringify(params);
    }
    
    // Track response time
    const startTime = Date.now();
    const response = await fetch(url.href, options);
    const responseTime = Date.now() - startTime;
    
    // Validate response
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    // Get budget for this endpoint type
    const budget = PERFORMANCE_BUDGETS.apiResponses[name] || {
      target: 300,
      acceptable: 600,
      critical: 1000
    };
    
    // Evaluate result
    const result = evaluateMetric('apiResponses', name, responseTime);
    
    // Create API test result
    const apiTest = {
      endpoint: path,
      method,
      responseTime,
      result,
      timestamp: Date.now()
    };
    
    console.log(`    Response time: ${responseTime}ms - ${result.status.toUpperCase()}`);
    
    // Add to results
    results.apiTests.push(apiTest);
  } catch (error) {
    console.error(`  Error testing API endpoint ${endpoint.path}:`, error);
    
    // Add a failed test result
    results.apiTests.push({
      endpoint: endpoint.path,
      method: endpoint.method,
      error: error.message,
      result: { status: 'fail', details: error.message },
      timestamp: Date.now()
    });
  }
}

// Run the tests
runBaselineTests().catch(error => {
  console.error('Error running baseline tests:', error);
  process.exit(1);
});
