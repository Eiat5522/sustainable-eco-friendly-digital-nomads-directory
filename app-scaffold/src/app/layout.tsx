import { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Sustainable Digital Nomads Directory',
  description: 'Find sustainable and eco-friendly coworking spaces, cafes, and accommodations in Thailand.',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white">
        {children}
      </body>
    </html>
  );
}
