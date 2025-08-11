'use client';

import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { AnalyticsProvider } from '@/components/AnalyticsProvider';

function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
}

interface ClientRootLayoutProps {
  children: ReactNode;
}

export default function ClientRootLayout({ children }: ClientRootLayoutProps) {
  return (
    <SessionProvider>
      <AnalyticsProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </AnalyticsProvider>
    </SessionProvider>
  );
}
