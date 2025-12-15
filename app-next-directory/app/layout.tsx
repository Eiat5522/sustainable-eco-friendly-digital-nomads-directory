import './globals.css';
import type React from 'react';

import { rootLayoutMetadata } from './layout.metadata';
export { rootLayoutMetadata as metadata };

import { normalizeTheme } from '@/utils/theme';
import ClientRootLayout from './ClientRootLayout';

const BODY_FONT_CLASS = 'font-sans antialiased';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const DEFAULT_THEME = 'system'; // Or 'light', 'dark'
  const theme = normalizeTheme(DEFAULT_THEME);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={BODY_FONT_CLASS}>
        <ClientRootLayout theme={theme}>{children}</ClientRootLayout>
      </body>
    </html>
  );
}
