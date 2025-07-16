'use client';

import { AnalyticsProvider } from '@/components/AnalyticsProvider';
import AuthProvider from '@/components/auth/AuthProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { PlausibleAnalyticsProvider } from '@/lib/analytics/plausible';
import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// Dynamically import web vitals reporter function then return a null component
const WebVitalsReporter = dynamic(
  async () => {
    await import('@/lib/performance/web-vitals-reporter');
    return () => null;
  },
  { ssr: false }
);

interface ClientLayoutProps {
  children: ReactNode;
  preview: boolean;
}

export default function ClientLayout({ children, preview }: ClientLayoutProps) {
  return (
    <ThemeProvider>
      <PlausibleAnalyticsProvider>
        <AuthProvider>
          <AnalyticsProvider>
            {children}
          </AnalyticsProvider>
        </AuthProvider>
      </PlausibleAnalyticsProvider>
    </ThemeProvider>
  );
}
