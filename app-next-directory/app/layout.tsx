import './globals.css'
import { cookies } from 'next/headers'
import type React from 'react'

import { rootLayoutMetadata } from './layout.metadata'
export { rootLayoutMetadata as metadata }

import ClientRootLayout from './ClientRootLayout'
import { normalizeTheme, themeClass, THEME_INIT_SCRIPT } from '@/utils/theme'

const BODY_FONT_CLASS = 'font-sans antialiased'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const rawTheme = (await cookies()).get('theme')?.value
  const theme = normalizeTheme(rawTheme)
  const htmlThemeClass = themeClass(theme)

  return (
    <html lang="en" className={htmlThemeClass} suppressHydrationWarning>
      <head>
        {/* SSR-safe, no-FOUC theme init: sets `dark` before hydration */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={BODY_FONT_CLASS}>
        <ClientRootLayout theme={theme}>
          {children}
        </ClientRootLayout>
      </body>
    </html>
  )
}
