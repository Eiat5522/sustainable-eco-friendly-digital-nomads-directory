'use client';

import type { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider as NextThemeProvider } from 'next-themes';

type ThemeProviderProps = Readonly<{
  children: ReactNode;
  theme?: 'light' | 'dark' | 'system';
}>;

function ThemeProvider({ children, theme = 'system' }: ThemeProviderProps) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme={theme}
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      {children}
    </NextThemeProvider>
  );
}

interface ClientRootLayoutProps {
  children: ReactNode;
  theme?: 'light' | 'dark' | 'system';
}

export default function ClientRootLayout({ children, theme }: Readonly<ClientRootLayoutProps>) {
  return (
    <SessionProvider>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
