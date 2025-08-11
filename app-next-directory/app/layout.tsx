import React from "react";
import "./globals.css";
import ClientRootLayout from "./ClientRootLayout";
import Footer from '@/components/layout/Footer';
import { MainNav } from '@/components/layout/MainNav';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
          <ClientRootLayout>
            <MainNav />
            <main className="flex-grow pt-16">
              {children}
            </main>
          </ClientRootLayout>
          <Footer />
        </div>
      </body>
    </html>
  );
}
