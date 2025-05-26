'use client';

import { useEffect } from 'react';

export function PerformanceMonitor() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance monitoring enabled in development mode');
    }
  }, []);

  return null;
}
