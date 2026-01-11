import './globals.css';
import type React from 'react';
import { Suspense } from 'react';

import { rootLayoutMetadata } from './layout.metadata';
export { rootLayoutMetadata as metadata };

import ClientRootLayout from './ClientRootLayout';

const BODY_FONT_CLASS = 'font-sans antialiased';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isServerTestMode = process.env.NEXT_PUBLIC_E2E === '1' || process.env.E2E === '1';

  return (
    <html lang="en" suppressHydrationWarning data-test-mode={isServerTestMode ? 'true' : undefined}>
      <head>{/* Theme support removed: no script injected here anymore */}</head>
      <body className={BODY_FONT_CLASS}>
        <Suspense fallback={<div className={BODY_FONT_CLASS}>Loading...</div>}>
          <ClientRootLayout>{children}</ClientRootLayout>
        </Suspense>
      </body>
    </html>
  );
}
