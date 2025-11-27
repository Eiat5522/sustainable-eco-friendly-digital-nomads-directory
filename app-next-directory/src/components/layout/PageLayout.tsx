'use client';

import type React from 'react';
// Remove direct imports for Header and Footer
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

      {/* Header and Footer are now handled by the root layout (ClientRootLayout) */}

      <main id="main-content" tabIndex={-1}>
        {children}
      </main>

      {/* Header and Footer are now handled by the root layout (ClientRootLayout) */}
    </div>
  );
}
