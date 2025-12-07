/**
 * Web Vitals Reporter for Performance Monitoring
 * 
 * This module reports Core Web Vitals metrics to our analytics endpoint
 * and provides utility functions for monitoring performance.
 * 
 * @version 1.0.0
 * @date May 15, 2025
 */

import { WEB_VITALS_CONFIG } from './monitoring-config';

/**
 * Report Web Vitals metrics to our analytics endpoint
 * Can be used with next.js reportWebVitals function
 * 
 * @param {Object} metric - The web vital metric object
 */
export function reportWebVitals(metric) {
  // Skip if disabled
  if (!WEB_VITALS_CONFIG.enabled) return;
  
  // Apply sampling rate
  if (Math.random() > WEB_VITALS_CONFIG.samplingRate) return;
  
  // Only report metrics we care about
  if (!WEB_VITALS_CONFIG.metrics.includes(metric.name)) return;
  
  // Debug mode - log to console
  if (WEB_VITALS_CONFIG.debug) {
    console.debug(`[Web Vitals] ${metric.name}: ${metric.value}`);
    
    // Check against thresholds
    const threshold = WEB_VITALS_CONFIG.thresholds[metric.name];
    if (threshold && metric.value > threshold) {
      console.warn(`[Web Vitals] ${metric.name} exceeds threshold: ${metric.value} > ${threshold}`);
    }
  }
  
  // Report to analytics endpoint
  try {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      id: metric.id,
      startTime: metric.startTime || performance.now(),
      label: metric.label,
      page: window.location.pathname,
    });
    
    // Use sendBeacon if supported, otherwise fallback to fetch
    if (navigator.sendBeacon) {
      navigator.sendBeacon(WEB_VITALS_CONFIG.reportingEndpoint, body);
    } else {
      fetch(WEB_VITALS_CONFIG.reportingEndpoint, {
        method: 'POST',
        body,
        keepalive: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('[Web Vitals] Error reporting metrics:', error);
  }
}

/**
 * A Higher Order Component (HOC) to mark the render time of component
 * Useful for measuring component-specific metrics
 * 
 * @param {string} componentName - The name of the component being measured
 * @param {Function} Component - The React component to wrap
 */
export function withPerformanceTracking(componentName, Component) {
  return function WrappedComponent(props) {
    // Skip if disabled
    if (!WEB_VITALS_CONFIG.enabled) {
      return <Component {...props} />;
    }

    const startTime = performance.now();
    
    // Store the render time after component renders
    React.useEffect(() => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Debug mode - log to console
      if (WEB_VITALS_CONFIG.debug) {
        console.debug(`[Component Render] ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
      
      // Report component render time as a custom metric
      try {
        const body = JSON.stringify({
          name: 'component-render',
          component: componentName,
          value: renderTime,
          page: window.location.pathname,
        });
        
        fetch(WEB_VITALS_CONFIG.reportingEndpoint, {
          method: 'POST',
          body,
          keepalive: true,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error('[Component Render] Error reporting metrics:', error);
      }
    }, []);
    
    return <Component {...props} />;
  };
}

/**
 * Measure function execution time
 * 
 * @param {Function} fn - The function to measure
 * @param {string} name - Optional name for the measurement
 * @returns The result of the function
 */
export function measureFunctionTime(fn, name = 'Function') {
  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();
  const executionTime = endTime - startTime;
  
  if (WEB_VITALS_CONFIG.debug) {
    console.debug(`[${name}] Execution time: ${executionTime.toFixed(2)}ms`);
  }
  
  return result;
}

// Export a performance metric recorder for custom metrics
export const recordMetric = (name, value, details = {}) => {
  // Skip if disabled
  if (!WEB_VITALS_CONFIG.enabled) return;
  
  // Apply sampling rate for custom metrics too
  if (Math.random() > WEB_VITALS_CONFIG.samplingRate) return;
  
  // Debug mode - log to console
  if (WEB_VITALS_CONFIG.debug) {
    console.debug(`[Custom Metric] ${name}: ${value}`, details);
  }
  
  // Report to analytics endpoint
  try {
    const body = JSON.stringify({
      name,
      value,
      details,
      timestamp: Date.now(),
      page: typeof window !== 'undefined' ? window.location.pathname : undefined,
    });
    
    // Use fetch as this may be called from server-side code too
    fetch(WEB_VITALS_CONFIG.reportingEndpoint, {
      method: 'POST',
      body,
      keepalive: true,
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(() => {}); // Ignore errors in reporting
  } catch (error) {
    console.error('[Custom Metric] Error reporting metrics:', error);
  }
};

export default reportWebVitals;
