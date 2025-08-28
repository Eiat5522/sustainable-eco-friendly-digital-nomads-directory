'use client';

import { ReactNode, useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { AnalyticsProvider } from '@/components/AnalyticsProvider';

function ThemeProvider({ children, theme }: Readonly<{ children: ReactNode, theme: string }>) {
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

    // Track anchors we already observe for attribute changes
    const observed = new WeakSet<Element>();

    const patchAll = () => {
      document
        .querySelectorAll('stagewise-companion-anchor')
        .forEach(apply);
    };

    // Observe only the anchors for attribute re-introductions
    const observeAnchors = () => {
      document
        .querySelectorAll('stagewise-companion-anchor')
        .forEach((anchor) => {
          if (!observed.has(anchor)) {
            observer.observe(anchor, {
              attributes: true,
              attributeFilter: ['role', 'tabindex', 'aria-hidden', 'inert'],
              subtree: false,
            });
            observed.add(anchor);
          }
        });
    };

    // Observe DOM for late inserts globally; do not listen to attributes globally
    const observer = new MutationObserver((records) => {
      if (records.some((r) => r.type === 'childList')) {
        patchAll();
        observeAnchors();
      }
      for (const r of records) {
        if (r.type === 'attributes') {
          const anchor = (r.target as Element).closest?.('stagewise-companion-anchor');
          if (anchor) apply(anchor);
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    // Run once on mount (after observer creation) and attach attribute observers
    patchAll();
    observeAnchors();
    return () => observer.disconnect();
  }, []);
  return null;
}

export default function ClientRootLayout({ children, theme }: Readonly<ClientRootLayoutProps>) {
  return (
    <SessionProvider>
      <AnalyticsProvider>
        <ThemeProvider theme={theme}>
          <ToolbarA11yPatch />
          {children}
        </ThemeProvider>
      </AnalyticsProvider>
    </SessionProvider>
  );
}
