import './globals.css'
import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { cookies } from 'next/headers'

const inter = Inter({ subsets: ['latin'] })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SustainableNomads - Eco-Friendly Digital Nomad Directory',
  description: 'Discover sustainable coworking spaces, cafes, accommodations, and activities for conscious digital nomads worldwide.',
}

import ClientRootLayout from './ClientRootLayout'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const theme = cookies().get('theme')?.value || 'light'

  return (
    <html lang="en" className={theme}>
      <body className={inter.className}>
        <ClientRootLayout theme={theme}>{children}</ClientRootLayout>
      </body>
    </html>
  )
}