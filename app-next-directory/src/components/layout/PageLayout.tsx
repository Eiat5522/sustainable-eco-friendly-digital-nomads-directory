'use client';

import type React from 'react';
import { Suspense } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { SkipLink } from '@/components/ui/skip-link';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  showFooterNewsletter?: boolean;
}

/**
 * Main page layout with accessibility features
 * - Skip links for keyboard navigation (blends with white header)
 * - Proper semantic landmarks
 * - Consistent navigation structure
 * - Scroll arrow provides visual navigation to main content
 */
export function PageLayout({
  children,
  className = '',
  showFooterNewsletter = true,
}: PageLayoutProps) {
  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* Skip Links - Styled to blend with white header, visible only on focus */}
      <SkipLink href="#main-content">Skip to main content</SkipLink>

      <Suspense fallback={<div>Loading header...</div>}>
        <Header />
      </Suspense>

      <main id="main-content" tabIndex={-1}>
        {children}
      </main>

      <Suspense fallback={<div>Loading footer...</div>}>
        <Footer showNewsletter={showFooterNewsletter} />
      </Suspense>
    </div>
  );
}
