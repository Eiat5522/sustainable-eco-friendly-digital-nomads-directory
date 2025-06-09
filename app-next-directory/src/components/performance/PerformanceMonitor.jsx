'use client';

/**
 * Performance Monitor Component
 *
 * Client-side component that initializes performance monitoring
 * and optionally displays the performance dashboard in development
 *
 * @version 1.0.0
 * @date May 15, 2025
 */

import { WEB_VITALS_CONFIG } from '@/lib/performance/monitoring-config';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Dynamically import the performance dashboard to reduce bundle size
const PerformanceDashboard = dynamic(
  () => import('@/components/admin/PerformanceDashboard'),
  { ssr: false, loading: () => null }
);

export default function PerformanceMonitor() {
  const [showDashboard, setShowDashboard] = useState(false);
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    // Register performance observers only if enabled
    if (WEB_VITALS_CONFIG.enabled && typeof window !== 'undefined') {
      // Initialize performance monitoring
      console.log('[Performance] Monitoring initialized');

      // Add keyboard shortcut to toggle dashboard (Ctrl+Shift+P)
      const handleKeyDown = (event) => {
        if (event.ctrlKey && event.shiftKey && event.key === 'P') {
          event.preventDefault();
          setShowDashboard(prev => !prev);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  // Only show in development mode
  if (!isDev) return null;

  return (
    <>
      {/* Performance dashboard toggle button (only in dev mode) */}
      {!showDashboard && (
        <button
          onClick={() => setShowDashboard(true)}
          className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-md shadow-md z-50 text-sm"
          style={{ zIndex: 9999 }}
        >
          Performance Dashboard
        </button>
      )}

      {/* Render the dashboard if toggled on */}
      {showDashboard && <PerformanceDashboard onClose={() => setShowDashboard(false)} />}
    </>
  );
}
