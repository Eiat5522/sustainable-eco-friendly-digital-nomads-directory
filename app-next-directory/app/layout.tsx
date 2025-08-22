import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: 'Sustainable Eco-Friendly Digital Nomads Directory',
    template: '%s | Sustainable Eco-Friendly Digital Nomads Directory',
  },

  description: 'Discover eco-friendly cities and resources for digital nomads. Listings, guides, and community tips for low-impact remote living in Thailand and beyond.'
};
import "./globals.css";
import { TwentyFirstToolbar } from '@21st-extension/toolbar-next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ClientRootLayout from './ClientRootLayout';

export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ClientRootLayout>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 z-[100] rounded bg-white dark:bg-gray-900 px-3 py-2 text-black dark:text-white shadow-lg"
          >
            Skip to main content
          </a>
          <TwentyFirstToolbar config={{ plugins: [] }} />
          <Header />
          <main id="main-content" tabIndex={-1} className="pt-16">
            {children}
          </main>
        </ClientRootLayout>
      </body>
    </html>
  );
}
