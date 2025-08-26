import React, { ReactNode } from 'react';

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  // Placeholder analytics provider - in production this would integrate with analytics services
  return <>{children}</>;
}