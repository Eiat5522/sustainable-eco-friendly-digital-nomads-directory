import { MainNav } from '@/components/navigation/MainNav';
import { SearchDialog } from '@/components/search/SearchDialog';
import { AnalyticsProvider } from '@/lib/analytics/analytics';
import { Metadata } from 'next';
import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { ReactNode, useState } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Sustainable Digital Nomads Directory',
    template: '%s | Sustainable Digital Nomads Directory',
  },
  description: 'Find eco-friendly workspaces and accommodations for digital nomads worldwide.',
};

interface RootLayoutProps {
  children: ReactNode;
}

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

export default function RootLayout({ children }: RootLayoutProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
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
      </body>
    </html>
  );
}
