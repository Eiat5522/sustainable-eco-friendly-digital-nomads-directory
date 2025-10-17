'use client'

import { ReactNode } from 'react';

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export default AnalyticsProvider;
