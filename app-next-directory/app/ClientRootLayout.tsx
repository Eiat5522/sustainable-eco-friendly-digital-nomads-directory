'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

type ThemeProviderProps = Readonly<{
  children: ReactNode;
  theme?: 'light' | 'dark' | 'system';
}>;

function resolveTheme(theme: ThemeProviderProps['theme']): 'light' | 'dark' {
  if (theme === 'light' || theme === 'dark') return theme;
  if (typeof window === 'undefined') return 'light';

  try {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function applyTheme(nextTheme: 'light' | 'dark') {
  const root = document.documentElement;
  root.classList.toggle('dark', nextTheme === 'dark');
  root.style.colorScheme = nextTheme;
}

function ThemeProvider({ children, theme = 'system' }: ThemeProviderProps) {
  useEffect(() => {
    applyTheme(resolveTheme(theme));
  }, [theme]);

  return children;
}

interface ClientRootLayoutProps {
  children: ReactNode;
  theme?: 'light' | 'dark' | 'system';
}

export default function ClientRootLayout({ children, theme }: Readonly<ClientRootLayoutProps>) {
  return (
    <SessionProvider>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </SessionProvider>
  );
}
