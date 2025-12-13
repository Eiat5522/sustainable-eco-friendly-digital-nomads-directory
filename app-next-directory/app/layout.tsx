import './globals.css';
import type React from 'react';

import { rootLayoutMetadata } from './layout.metadata';
export { rootLayoutMetadata as metadata };

import { normalizeTheme, THEME_INIT_SCRIPT, themeClass } from '@/utils/theme';
import ClientRootLayout from './ClientRootLayout';

const BODY_FONT_CLASS = 'font-sans antialiased';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const DEFAULT_THEME = 'system'; // Or 'light', 'dark'
  const theme = normalizeTheme(DEFAULT_THEME);
  const htmlThemeClass = themeClass(theme);

  return (
    <html lang="en" className={htmlThemeClass} suppressHydrationWarning>
      <head>
        {/* SSR-safe, no-FOUC theme init: sets `dark` before hydration */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: Static theme script is safe */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={BODY_FONT_CLASS}>
        <ClientRootLayout theme={theme}>{children}</ClientRootLayout>
      </body>
    </html>
  );
}
