import './globals.css'
import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import React from 'react'

const inter = Inter({ subsets: ['latin'] })

import { rootLayoutMetadata } from './layout.metadata'
export { rootLayoutMetadata as metadata }

import ClientRootLayout from './ClientRootLayout'
import { normalizeTheme, themeClass, THEME_INIT_SCRIPT } from '@/utils/theme'

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
      <body className={inter.className}>
        <ClientRootLayout theme={theme}>
          {children}
        </ClientRootLayout>
      </body>
    </html>
  )
}
