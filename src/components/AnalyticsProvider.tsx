'use client';

import { ConsentBanner } from '@/components/ConsentBanner';
import { Analytics } from '@vercel/analytics/react';
import { type ReactNode } from 'react';

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const mode = process.env.NODE_ENV === 'development' ? 'development' : 'production';

  return (
    <>
      {children}
      <Analytics debug={process.env.NODE_ENV === 'development'} mode={mode} />
      <ConsentBanner />
    </>
  );
}
