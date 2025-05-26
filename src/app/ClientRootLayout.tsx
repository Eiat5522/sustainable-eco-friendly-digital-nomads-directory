"use client";

import { MainNav } from '@/components/navigation/MainNav';
import { SearchDialog } from '@/components/search/SearchDialog';
import { AnalyticsProvider } from '@/lib/analytics/analytics';
import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { ReactNode, useState } from 'react';

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <AnalyticsProvider>
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50">
          <MainNav onSearchClick={() => setIsSearchOpen(true)} />
          <SearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
          <main className="pt-16">
            {children}
          </main>
        </div>
      </ThemeProvider>
    </AnalyticsProvider>
  );
}
