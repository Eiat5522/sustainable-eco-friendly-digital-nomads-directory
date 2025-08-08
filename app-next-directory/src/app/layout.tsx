
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
      <head>
        <link 
          rel="stylesheet" 
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body>
        <ClientRootLayout>
          {children}
        </ClientRootLayout>
      </body>
    </html>
  );
}
