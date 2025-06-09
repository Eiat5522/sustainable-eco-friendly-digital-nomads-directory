# Performance Monitoring System Documentation

## Overview

This document describes the performance monitoring system implemented in the Sustainable Digital Nomads Directory application. The system combines Plausible Analytics for privacy-focused web analytics with custom performance monitoring for detailed insights.

## System Components

### 1. Plausible Analytics Integration
Located in `src/lib/analytics/plausible/`
- `config.ts`: Base configuration and event types
- `hooks.ts`: Custom hooks for tracking user interactions
- `provider.tsx`: React context provider for analytics

### 2. Performance Metrics Collector
Located in `src/lib/performance/collector.ts`
- Collects Core Web Vitals
- Tracks custom performance marks
- Reports metrics to Plausible
- Handles both client and server-side metrics

### 3. Server Timing Middleware
Located in `src/middleware/server-timing.ts`
- Adds Server-Timing headers to responses
- Tracks backend performance metrics
- Integrates with Plausible for server-side events

### 4. Performance Budgets and Alerts
Located in `src/lib/performance/budgets.ts`
- Defines performance thresholds
- Configures alerting channels
- Handles alert delivery

## Key Features

1. **Privacy-First Analytics**
   - No cookies required
   - GDPR compliant
   - Minimal data collection

2. **Performance Monitoring**
   - Core Web Vitals tracking
   - Custom performance marks
   - Server-side timing
   - Real-time alerting

3. **Alerting System**
   - Multiple channels (console, Slack, email)
   - Configurable thresholds
   - Severity levels

## Usage Guidelines

### Adding Custom Performance Marks

```typescript
import { markPerformance, measurePerformance } from '@/lib/performance/collector'

// Start timing
markPerformance('MAP_INIT')

// End timing and measure
markPerformance('MAP_MARKERS_LOADED')
measurePerformance('map-loading', 'MAP_INIT', 'MAP_MARKERS_LOADED')
```

### Tracking Business Events

```typescript
import { usePlausibleAnalytics } from '@/lib/analytics/plausible'

function YourComponent() {
  const { trackListingEvent } = usePlausibleAnalytics()

  const handleAction = () => {
    trackListingEvent({
      listingId: 'id',
      action: 'view',
      category: 'coworking',
      city: 'bangkok'
    })
  }
}
```

### Server-Side Timing

```typescript
import { ServerTiming } from '@/middleware/server-timing'

export async function GET() {
  const timing = new ServerTiming()

  timing.startTiming('db-query')
  // ... perform database query
  timing.endTiming('db-query', 'Database query time')

  return Response.json(data, {
    headers: {
      'Server-Timing': timing.getHeaderValue()
    }
  })
}
```

## Maintenance Tasks

### 1. Regular Monitoring
- Review performance dashboards daily
- Check alert logs weekly
- Analyze trends monthly

### 2. Performance Budgets
- Review budgets quarterly
- Adjust thresholds based on data
- Update alert configurations as needed

### 3. Alert Management
- Verify alert channels are working
- Update alert recipients
- Review alert severity levels

### 4. Code Updates
- Keep dependencies updated
- Monitor for security patches
- Review performance impact of new features

## Troubleshooting

### Common Issues

1. **Missing Metrics**
   - Check browser console for errors
   - Verify Plausible configuration
   - Check network requests

2. **False Alerts**
   - Review threshold configurations
   - Check for environment-specific issues
   - Verify alert filtering rules

3. **Performance Degradation**
   - Check recent code changes
   - Review server resources
   - Monitor external dependencies

## Best Practices

1. **Performance Monitoring**
   - Add custom marks for critical paths
   - Use meaningful metric names
   - Include context with alerts

2. **Analytics Events**
   - Use consistent event names
   - Include relevant properties
   - Validate data before sending

3. **Alert Management**
   - Set appropriate thresholds
   - Configure alert routing
   - Document alert responses

## Security Considerations

1. **Data Privacy**
   - No personal data in metrics
   - Secure alert channels
   - Regular security reviews

2. **Access Control**
   - Restrict dashboard access
   - Secure API endpoints
   - Audit access logs

## Future Improvements

1. **Planned Enhancements**
   - Real-time dashboard
   - Advanced anomaly detection
   - Machine learning forecasting

2. **Integration Options**
   - Additional alert channels
   - Extended metric collection
   - Custom reporting tools

## Support

For issues or questions:
1. Check the troubleshooting guide
2. Review recent changes
3. Contact the development team

## Version History

- v1.0.0 (2025-05-18): Initial implementation
  - Plausible Analytics integration
  - Custom performance monitoring
  - Alert system implementation
