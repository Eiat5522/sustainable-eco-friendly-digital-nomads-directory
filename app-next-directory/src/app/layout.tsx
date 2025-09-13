import './globals.css'
import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import dynamic from 'next/dynamic'

const inter = Inter({ subsets: ['latin'] })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SustainableNomads - Eco-Friendly Digital Nomad Directory',
  description: 'Discover sustainable coworking spaces, cafes, accommodations, and activities for conscious digital nomads worldwide.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const MswInit = dynamic(() => import('../components/MswInit'), { ssr: false })
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Start MSW worker only during E2E runs (no-op otherwise) */}
        <MswInit />
        {children}
      </body>
    </html>
  )
}
