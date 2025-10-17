'use client'

import React, { useEffect } from 'react';
import { recordMetric } from './web-vitals-reporter';

export function withPerformanceTracking<P extends Record<string, unknown>>(componentName: string, Component: React.ComponentType<P>) {
  return function WrappedComponent(props: P) {
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    useEffect(() => {
      const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const renderTime = endTime - startTime;
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[Component Render] ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
      recordMetric(`component-render-${componentName}`, Math.round(renderTime), { page: typeof window !== 'undefined' ? window.location.pathname : undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <Component {...props} />;
  };
}

export default withPerformanceTracking;
