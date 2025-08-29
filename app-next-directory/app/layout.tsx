import './globals.css'
import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { cookies } from 'next/headers'
import React from 'react'

const inter = Inter({ subsets: ['latin'] })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SustainableNomads - Eco-Friendly Digital Nomad Directory',
  description: 'Discover sustainable coworking spaces, cafes, accommodations, and activities for conscious digital nomads worldwide.',
}

import ClientRootLayout from './ClientRootLayout'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Sanitize and whitelist the theme cookie
  type Theme = 'light' | 'dark' | 'system'
  const cookieStore = await cookies()
  const rawTheme = cookieStore.get('theme')?.value?.toLowerCase()?.trim()





  const theme: Theme =
    rawTheme === 'light' || rawTheme === 'dark' || rawTheme === 'system'
      ? (rawTheme as Theme)
      : 'system'
  const htmlThemeClass = theme === 'system' ? undefined : theme

  return (
    <html lang="en" className={htmlThemeClass} suppressHydrationWarning>
      <head>
        {/* SSR-safe, no-FOUC theme init: sets `dark` before hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  try {
    const d = document.documentElement;
    const m = document.cookie.match(/(?:^|; )theme=([^;]+)/);
    const t = m ? decodeURIComponent(m[1]).toLowerCase() : 'system';
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = t === 'dark' || (t !== 'light' && prefersDark);
    d.classList.toggle('dark', isDark);
    d.style.colorScheme = isDark ? 'dark' : 'light';
  } catch {}
})();`,
          }}
        />
      </head>
      <body className={inter.className}>
        <ClientRootLayout theme={theme}>
          {children}
        </ClientRootLayout>
      </body>
    </html>
  )
}
