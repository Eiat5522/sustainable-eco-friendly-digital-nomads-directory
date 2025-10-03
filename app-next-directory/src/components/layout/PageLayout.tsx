'use client'

import React from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { SkipLink } from '@/components/ui/skip-link'

interface PageLayoutProps {
  children: React.ReactNode
  className?: string
}

/**
 * Main page layout with accessibility features
 * - Skip links for keyboard navigation
 * - Proper semantic landmarks
 * - Consistent navigation structure
 */
export function PageLayout({ children, className = '' }: PageLayoutProps) {
  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* Skip Links - Must be first focusable elements */}
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      
      <Header />
      
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      
      <Footer />
    </div>
  )
}