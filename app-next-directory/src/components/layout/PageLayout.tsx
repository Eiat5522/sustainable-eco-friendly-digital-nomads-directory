'use client';

import type React from 'react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { SkipLink } from '@/components/ui/skip-link';
import { Suspense } from 'react';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Main page layout with accessibility features
 * - Skip links for keyboard navigation (blends with white header)
 * - Proper semantic landmarks
 * - Consistent navigation structure
 * - Scroll arrow provides visual navigation to main content
 */
export function PageLayout({ children, className = '' }: PageLayoutProps) {
  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* Skip Links - Styled to blend with white header, visible only on focus */}
      <SkipLink href="#main-content">Skip to main content</SkipLink>

      <Header />

      <main id="main-content" tabIndex={-1}>
        {children}
      </main>

      <Suspense fallback={<div className="h-48 rounded-lg bg-muted animate-pulse" role="status" aria-label="Loading footer" aria-busy="true" />}>
        <Footer />
      </Suspense>
    </div>
  );
}
