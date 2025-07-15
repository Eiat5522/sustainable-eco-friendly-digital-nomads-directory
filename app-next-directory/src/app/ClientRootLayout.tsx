'use client';

import Footer from '@/components/layout/Footer'; // Added Footer import
import { MainNav } from '@/components/layout/MainNav'; // Corrected import path
import { SearchDialog } from '@/components/search/SearchDialog';
import { AnalyticsProvider } from '@/lib/analytics/analytics.tsx';
import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { SessionProvider } from "@auth/nextjs/react";
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
    <SessionProvider>
      <AnalyticsProvider>
        <ThemeProvider>
          <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            {' '}
            {/* Added flex flex-col */}
            <MainNav />
            <SearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
            <main className="flex-grow pt-16">
              {' '}
              {/* Added flex-grow */}
              {children}
            </main>
            <Footer /> {/* Added Footer component */}
          </div>
        </ThemeProvider>
      </AnalyticsProvider>
    </SessionProvider>
  );
}
