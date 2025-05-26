'use client';

import { AnalyticsProvider } from '@/components/AnalyticsProvider';
import AuthProvider from '@/components/auth/AuthProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { PlausibleAnalyticsProvider } from '@/lib/analytics/plausible';
import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// Dynamically import web vitals reporter to avoid SSR issues
const WebVitalsReporter = dynamic(
  () => import('@/lib/performance/web-vitals-reporter').then((mod) => mod.default),
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
