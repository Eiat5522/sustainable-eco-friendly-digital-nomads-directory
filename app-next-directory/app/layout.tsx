import './globals.css';
import type React from 'react';

import { rootLayoutMetadata } from './layout.metadata';
export { rootLayoutMetadata as metadata };

import ClientRootLayout from './ClientRootLayout';

const BODY_FONT_CLASS = 'font-sans antialiased';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={BODY_FONT_CLASS}>
        <ClientRootLayout>{children}</ClientRootLayout>
      </body>
    </html>
  );
}
