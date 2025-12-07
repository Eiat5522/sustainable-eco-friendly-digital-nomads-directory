/**
 * Custom App Component with Performance Monitoring Integration
 * 
 * @version 1.0.0
 * @date May 15, 2025
 */

import { useEffect } from 'react';
import { reportWebVitals } from '@/lib/performance/web-vitals-reporter';
import { WEB_VITALS_CONFIG } from '@/lib/performance/monitoring-config';

export function reportWebVitalsToAnalytics(metric) {
  // Use our custom web vitals reporter
  reportWebVitals(metric);
}

export default function App({ Component, pageProps }) {
  // Performance monitoring in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && WEB_VITALS_CONFIG.debug) {
      console.log('Performance monitoring enabled in development mode');
    }
  }, []);

  return <Component {...pageProps} />;
}

// Enable web vitals reporting
export function reportWebVitals(metric) {
  reportWebVitalsToAnalytics(metric);
}
