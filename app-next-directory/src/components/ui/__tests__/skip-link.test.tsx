import React from 'react';
import { render, screen } from '@testing-library/react';
import { SkipLink } from '../skip-link';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => {
    return <a href={href} {...props}>{children}</a>;
  },
}));

describe('SkipLink', () => {
  describe('Basic Rendering', () => {
    it('renders with children text', () => {
      render(<SkipLink href="#main">Skip to content</SkipLink>);
      expect(screen.getByText('Skip to content')).toBeInTheDocument();
    });

    it('renders as a link element', () => {
      render(<SkipLink href="#main">Skip</SkipLink>);
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    it('applies href attribute', () => {
      render(<SkipLink href="#main-content">Skip to main</SkipLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '#main-content');
    });
  });

  describe('Default Styling', () => {
    it('applies position and visibility classes', () => {
      render(<SkipLink href="#main">Skip</SkipLink>);
      const link = screen.getByRole('link');
      
      expect(link).toHaveClass('absolute');
      expect(link).toHaveClass('left-4');
      expect(link).toHaveClass('top-4');
      expect(link).toHaveClass('z-50');
      expect(link).toHaveClass('-translate-y-full');
    });

    it('applies appearance classes', () => {
      render(<SkipLink href="#main">Skip</SkipLink>);
      const link = screen.getByRole('link');
      
      expect(link).toHaveClass('rounded-md');
      expect(link).toHaveClass('bg-white');
      expect(link).toHaveClass('px-4');
      expect(link).toHaveClass('py-2');
      expect(link).toHaveClass('font-semibold');
      expect(link).toHaveClass('text-white');
    });

    it('applies neo-primary background on focus', () => {
      render(<SkipLink href="#main">Skip</SkipLink>);
      const link = screen.getByRole('link');

      expect(link).toHaveClass('focus:bg-neo-primary');
    });

    it('applies transition classes', () => {
      render(<SkipLink href="#main">Skip</SkipLink>);
      const link = screen.getByRole('link');
      
      expect(link).toHaveClass('transition-transform');
      expect(link).toHaveClass('duration-150');
      expect(link).toHaveClass('ease-in-out');
    });

    it('applies focus styles', () => {
      render(<SkipLink href="#main">Skip</SkipLink>);
      const link = screen.getByRole('link');
      
      expect(link).toHaveClass('focus:translate-y-0');
      expect(link).toHaveClass('focus:outline-none');
      expect(link).toHaveClass('focus:ring-2');
      expect(link).toHaveClass('focus:ring-neo-primary');
      expect(link).toHaveClass('focus:ring-offset-2');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(
        <SkipLink href="#main" className="custom-class">
          Skip
        </SkipLink>
      );
      const link = screen.getByRole('link');
      
      expect(link).toHaveClass('custom-class');
      expect(link).toHaveClass('absolute'); // Still has default classes
    });

    it('merges custom className with default classes', () => {
      render(
        <SkipLink href="#main" className="bg-blue-600 text-lg">
          Skip
        </SkipLink>
      );
      const link = screen.getByRole('link');
      
      expect(link).toHaveClass('bg-blue-600');
      expect(link).toHaveClass('text-lg');
      expect(link).toHaveClass('rounded-md');
    });
  });

  describe('Different Href Targets', () => {
    it('links to main content', () => {
      render(<SkipLink href="#main">Skip to main content</SkipLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '#main');
    });

    it('links to navigation', () => {
      render(<SkipLink href="#navigation">Skip to navigation</SkipLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '#navigation');
    });

    it('links to footer', () => {
      render(<SkipLink href="#footer">Skip to footer</SkipLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '#footer');
    });

    it('handles route paths', () => {
      render(<SkipLink href="/about">Skip to about</SkipLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/about');
    });
  });

  describe('Content Variations', () => {
    it('renders with short text', () => {
      render(<SkipLink href="#main">Skip</SkipLink>);
      expect(screen.getByText('Skip')).toBeInTheDocument();
    });

    it('renders with longer descriptive text', () => {
      const text = 'Skip to main content area';
      render(<SkipLink href="#main">{text}</SkipLink>);
      expect(screen.getByText(text)).toBeInTheDocument();
    });

    it('renders with complex children', () => {
      render(
        <SkipLink href="#main">
          <span>Skip to</span> <strong>main</strong>
        </SkipLink>
      );
      expect(screen.getByText('Skip to')).toBeInTheDocument();
      expect(screen.getByText('main')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('is keyboard accessible', () => {
      render(<SkipLink href="#main">Skip to content</SkipLink>);
      const link = screen.getByRole('link');
      
      // Skip link should be focusable
      link.focus();
      expect(document.activeElement).toBe(link);
    });

    it('has proper role', () => {
      render(<SkipLink href="#main">Skip</SkipLink>);
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    it('provides clear link text for screen readers', () => {
      render(<SkipLink href="#main">Skip to main content</SkipLink>);
      const link = screen.getByRole('link', { name: 'Skip to main content' });
      expect(link).toBeInTheDocument();
    });
  });

  describe('WCAG Compliance', () => {
    it('is hidden by default with -translate-y-full', () => {
      render(<SkipLink href="#main">Skip</SkipLink>);
      const link = screen.getByRole('link');
      
      // Should have class that moves it off-screen
      expect(link).toHaveClass('-translate-y-full');
    });

    it('becomes visible on focus with focus:translate-y-0', () => {
      render(<SkipLink href="#main">Skip</SkipLink>);
      const link = screen.getByRole('link');
      
      // Should have focus class that brings it into view
      expect(link).toHaveClass('focus:translate-y-0');
    });

    it('has high z-index for visibility', () => {
      render(<SkipLink href="#main">Skip</SkipLink>);
      const link = screen.getByRole('link');
      
      expect(link).toHaveClass('z-50');
    });
  });

  describe('Multiple Skip Links', () => {
    it('renders multiple skip links', () => {
      render(
        <>
          <SkipLink href="#main">Skip to main</SkipLink>
          <SkipLink href="#nav">Skip to navigation</SkipLink>
          <SkipLink href="#footer">Skip to footer</SkipLink>
        </>
      );
      
      expect(screen.getByText('Skip to main')).toBeInTheDocument();
      expect(screen.getByText('Skip to navigation')).toBeInTheDocument();
      expect(screen.getByText('Skip to footer')).toBeInTheDocument();
    });

    it('each skip link has unique href', () => {
      render(
        <>
          <SkipLink href="#main">Skip to main</SkipLink>
          <SkipLink href="#nav">Skip to navigation</SkipLink>
        </>
      );
      
      const links = screen.getAllByRole('link');
      expect(links[0]).toHaveAttribute('href', '#main');
      expect(links[1]).toHaveAttribute('href', '#nav');
    });
  });
});
