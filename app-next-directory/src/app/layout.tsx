import './globals.css';
import { Inter } from 'next/font/google';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SessionWrapper from '@/components/layout/SessionWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Leaf & Laptop',
  description: 'Sustainable travel accommodations',
};

import { SessionProvider } from 'next-auth/react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionWrapper>
          <Header />
        </SessionWrapper>
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
