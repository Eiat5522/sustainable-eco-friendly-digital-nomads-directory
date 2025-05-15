# Performance Testing Documentation

## Overview

This document outlines the performance testing strategy for the Sustainable Eco-Friendly Digital Nomads Directory. It describes how we establish baseline performance metrics, conduct regular testing, and validate our monitoring and alerting setup.

## Goals

1. **Establish baseline performance metrics** for key user flows and API endpoints
2. **Validate monitoring tools** are correctly capturing performance data
3. **Verify alerting thresholds** trigger appropriate notifications when performance degrades
4. **Identify potential bottlenecks** before they impact users
5. **Ensure the application meets** defined performance budgets

## Performance Testing Tools

We use the following tools for performance testing:

- **Lighthouse**: For measuring Core Web Vitals and other performance metrics
- **Puppeteer**: For automating browser-based tests
- **Custom testing script**: To orchestrate tests and collect results
- **Performance API**: To collect real user metrics (RUM)
- **Server Timing middleware**: To measure server-side performance

## Testing Procedure

### 1. Baseline Performance Testing

Baseline tests should be run:
- Before major releases
- After significant infrastructure changes
- At least once per sprint

To run a baseline test:

```bash
cd app-scaffold
npm install puppeteer lighthouse --save-dev
node scripts/run-baseline-tests.js --env=development
```

Available environments:
- `development`: Local development server (default)
- `staging`: Staging environment
- `production`: Production environment (use with caution)

### 2. Analyzing Results

After running baseline tests, a Markdown report is generated in the `test-results/performance` directory. This report includes:

- Summary of test results
- Page load metrics compared to budgets
- API response times compared to budgets
- Recommendations for improvements

Performance metrics are evaluated against three thresholds:
- **Target**: Ideal performance
- **Acceptable**: Minimum acceptable performance
- **Critical**: Performance that requires immediate attention

### 3. Validating Monitoring

To verify that our monitoring tools are correctly capturing performance data:

1. Run the baseline tests to generate known performance metrics
2. Check that these metrics are captured in our monitoring dashboards
3. Artificially trigger poor performance and verify that alerts are triggered

#### Validating Web Vitals Collection

```javascript
// Simulate a poor LCP value
performance.measure('LCP', { 
  startTime: 0, 
  duration: 6000 // 6 seconds (exceeds critical threshold)
});
```

#### Validating API Monitoring

```bash
# Use a tool like ApacheBench to send many requests to an API endpoint
ab -n 100 -c 10 https://example.com/api/listings
```

### 4. Regular Testing Schedule

- **Daily**: Automated tests run against staging environment
- **Weekly**: Full baseline tests run against staging environment
- **Monthly**: Full baseline tests run against production environment (during low-traffic periods)
- **Pre-release**: Complete testing suite run before each release

## Performance Budgets

Our performance budgets are defined in:
```
src/lib/performance/performance-budgets.js
```

These budgets define our expectations for:
- Page load metrics (FCP, LCP, TTI, CLS, etc.)
- Resource sizes (JS, CSS, images, fonts, etc.)
- API response times
- Component-specific metrics
- Server resource utilization

## Alerting Thresholds

Alerting thresholds are defined in:
```
src/lib/performance/alerting-thresholds.js
```

When metrics exceed these thresholds, the following actions occur:
- **Warning**: Alerts are logged and posted to Slack
- **Error**: Alerts are logged, posted to Slack, and emailed to the team
- **Critical**: Alerts are logged, posted to Slack, emailed, and trigger immediate notification

## Interpreting Test Results

### Web Vitals Interpretation

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| FCP | ≤ 1.5s | ≤ 2.5s | > 3.5s |
| LCP | ≤ 2.5s | ≤ 4.0s | > 6.0s |
| TTI | ≤ 3.5s | ≤ 5.0s | > 7.5s |
| CLS | ≤ 0.1 | ≤ 0.25 | > 0.5 |
| FID | ≤ 100ms | ≤ 300ms | > 500ms |

### API Response Time Interpretation

| API Endpoint | Good | Needs Improvement | Poor |
|--------------|------|-------------------|------|
| Listings | ≤ 300ms | ≤ 600ms | > 1000ms |
| Search | ≤ 500ms | ≤ 800ms | > 1200ms |
| Map Data | ≤ 400ms | ≤ 700ms | > 1100ms |
| User Profile | ≤ 250ms | ≤ 500ms | > 800ms |

## Recommended Actions

Based on test results, consider these optimization strategies:

### For Poor FCP/LCP
- Optimize server response time
- Reduce render-blocking resources
- Implement critical CSS
- Optimize image loading

### For Poor TTI/TBT
- Reduce JavaScript execution time
- Break up long tasks
- Defer non-critical JavaScript
- Minimize main thread work

### For Poor CLS
- Set size attributes on images and videos
- Reserve space for dynamic content
- Avoid inserting content above existing content
- Use CSS transform for animations

### For Slow API Responses
- Optimize database queries
- Implement caching strategies
- Reduce payload size
- Consider data pagination

## Continuous Improvement

After each testing cycle:

1. Document findings in the performance report
2. Prioritize optimizations based on impact and effort
3. Implement optimizations
4. Re-test to verify improvements
5. Update performance budgets if necessary

---

*Last Updated: May 15, 2025*
