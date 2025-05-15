import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import Layout from '@/components/layout/Layout';
import { draftMode } from 'next/headers';
import AuthProvider from '@/components/auth/AuthProvider';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    template: '%s | Sustainable Digital Nomads Directory',
    default: 'Sustainable Digital Nomads Directory - Eco-Friendly Spaces in Thailand'
  },
  description: 'Find sustainable and eco-friendly coworking spaces, cafes, and accommodations in Thailand. Perfect for digital nomads who care about the environment.',
  keywords: ['sustainable', 'eco-friendly', 'digital nomads', 'thailand', 'coworking', 'cafe', 'accommodation'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if preview mode is enabled
  const isPreview = draftMode().isEnabled;
  
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <Layout preview={isPreview}>
            {children}
          </Layout>
        </AuthProvider>
      </body>
    </html>
  );
}
