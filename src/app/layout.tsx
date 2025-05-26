
import { Metadata } from 'next';
import { ReactNode } from 'react';
import './globals.css';
import ClientRootLayout from './ClientRootLayout';

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ClientRootLayout>
          {children}
        </ClientRootLayout>
      </body>
    </html>
  );
}
