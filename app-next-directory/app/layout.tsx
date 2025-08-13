import React from "react";
import "./globals.css";
import { TwentyFirstToolbar } from '@21st-extension/toolbar-next';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 z-50 rounded bg-white px-3 py-2 text-black"
        >
          Skip to main content
        </a>
        <TwentyFirstToolbar config={{ plugins: [] }} />
        <main id="main-content" tabIndex={-1}>{children}</main>
      </body>
    </html>
  );
}
