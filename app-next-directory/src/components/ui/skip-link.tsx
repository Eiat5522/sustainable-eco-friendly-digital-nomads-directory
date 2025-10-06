'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface SkipLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

/**
 * Skip Link Component for accessibility
 * Allows keyboard and screen reader users to skip past navigation to main content
 * Following WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/Techniques/general/G1.html
 * 
 * Note: Styled with white background, border, and text to be completely invisible against white header when not focused
 */
export function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        // Hidden by default, visible on focus - completely white to blend with header
        'absolute left-4 top-4 z-50 -translate-y-full transform',
        'rounded-md bg-white border border-white px-4 py-2 text-sm font-semibold text-white',
        'transition-transform duration-150 ease-in-out',
        'focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-neo-primary focus:ring-offset-2',
        'focus:bg-neo-primary focus:text-white focus:border-neo-primary', // Only becomes prominent when focused
        className
      )}
    >
      {children}
    </Link>
  )
}