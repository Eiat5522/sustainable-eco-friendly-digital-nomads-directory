import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import Layout from '@/components/layout/Layout';

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
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className={`${inter.className} antialiased`}>
        <Layout>
          {children}
        </Layout>
      </body>
    </html>
  );
}
