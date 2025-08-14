'use client';

import { ReactNode, useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { AnalyticsProvider } from '@/components/AnalyticsProvider';

function ThemeProvider({ children }: Readonly<{ children: ReactNode }>) {
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

function ToolbarA11yPatch() {
  useEffect(() => {
    const apply = (anchor: Element) => {
      const root: ParentNode = (anchor as HTMLElement).shadowRoot ?? anchor;
      const fixed = (root)
        .querySelector('div.fixed');
      const target = (fixed ?? (anchor as HTMLElement)) as HTMLElement;
      // Remove a11y-affecting attributes and make the subtree inert
      target.removeAttribute('role');
      target.removeAttribute('tabindex');
      target.setAttribute('aria-hidden', 'true');
      target.setAttribute('inert', '');
      // Belt-and-suspenders: hide the top-level anchor, too
      (anchor as HTMLElement).setAttribute('aria-hidden', 'true');
      (anchor as HTMLElement).setAttribute('inert', '');
    };

    const patchAll = () => {
      document
        .querySelectorAll('stagewise-companion-anchor')
        .forEach(apply);
    };

    // Run once on mount
    patchAll();

    // Observe DOM for late inserts or attribute re-introductions
    const observer = new MutationObserver(() => {
      patchAll();
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['role', 'tabindex'],
    });

    return () => observer.disconnect();
  }, []);
  return null;
}

export default function ClientRootLayout({ children }: Readonly<ClientRootLayoutProps>) {
  return (
    <SessionProvider>
      <AnalyticsProvider>
        <ThemeProvider>
          <ToolbarA11yPatch />
          {children}
        </ThemeProvider>
      </AnalyticsProvider>
    </SessionProvider>
  );
}
