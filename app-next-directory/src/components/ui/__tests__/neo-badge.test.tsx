import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge, badgeVariants } from '../badge';

describe('Badge (Neo/Neomorphic Styling)', () => {
  describe('Base Styling and CSS Classes', () => {
    it('should apply base CSS classes', () => {
      render(<Badge data-testid="badge">Test Badge</Badge>);
      const badge = screen.getByTestId('badge');
      
      expect(badge).toHaveClass('inline-flex');
      expect(badge).toHaveClass('items-center');
      expect(badge).toHaveClass('rounded-full');
      expect(badge).toHaveClass('border');
      expect(badge).toHaveClass('px-2.5');
      expect(badge).toHaveClass('py-0.5');
      expect(badge).toHaveClass('text-xs');
      expect(badge).toHaveClass('font-semibold');
    });

    it('should apply transition classes', () => {
      render(<Badge data-testid="badge">Test</Badge>);
      const badge = screen.getByTestId('badge');
      
      expect(badge).toHaveClass('transition-colors');
    });

    it('should apply focus styles', () => {
      render(<Badge data-testid="badge">Test</Badge>);
      const badge = screen.getByTestId('badge');
      
      expect(badge).toHaveClass('focus:outline-none');
      expect(badge).toHaveClass('focus:ring-2');
      expect(badge).toHaveClass('focus:ring-ring');
      expect(badge).toHaveClass('focus:ring-offset-2');
    });
  });

  describe('Variant Styling', () => {
    it('should apply default variant styles', () => {
      render(<Badge data-testid="badge">Default</Badge>);
      const badge = screen.getByTestId('badge');
      
      expect(badge).toHaveClass('border-transparent');
      expect(badge).toHaveClass('bg-primary-500');
      expect(badge).toHaveClass('text-white');
      expect(badge).toHaveClass('hover:bg-primary-600');
    });

    it('should apply secondary variant styles', () => {
      render(<Badge data-testid="badge" variant="secondary">Secondary</Badge>);
      const badge = screen.getByTestId('badge');
      
      expect(badge).toHaveClass('border-transparent');
      expect(badge).toHaveClass('bg-secondary');
      expect(badge).toHaveClass('text-secondary-foreground');
      expect(badge).toHaveClass('hover:bg-secondary/80');
    });

    it('should apply outline variant styles', () => {
      render(<Badge data-testid="badge" variant="outline">Outline</Badge>);
      const badge = screen.getByTestId('badge');
      
      expect(badge).toHaveClass('text-primary-600');
      expect(badge).toHaveClass('border-primary-200');
      expect(badge).toHaveClass('hover:bg-primary-100');
    });

    it('should apply success variant styles', () => {
      render(<Badge data-testid="badge" variant="success">Success</Badge>);
      const badge = screen.getByTestId('badge');
      
      expect(badge).toHaveClass('border-transparent');
      expect(badge).toHaveClass('bg-green-500');
      expect(badge).toHaveClass('text-white');
      expect(badge).toHaveClass('hover:bg-green-600');
    });

    it('should apply warning variant styles', () => {
      render(<Badge data-testid="badge" variant="warning">Warning</Badge>);
      const badge = screen.getByTestId('badge');
      
      expect(badge).toHaveClass('border-transparent');
      expect(badge).toHaveClass('bg-yellow-500');
      expect(badge).toHaveClass('text-white');
      expect(badge).toHaveClass('hover:bg-yellow-600');
    });

    it('should apply destructive variant styles', () => {
      render(<Badge data-testid="badge" variant="destructive">Error</Badge>);
      const badge = screen.getByTestId('badge');
      
      expect(badge).toHaveClass('border-transparent');
      expect(badge).toHaveClass('bg-red-500');
      expect(badge).toHaveClass('text-white');
      expect(badge).toHaveClass('hover:bg-red-600');
    });

    it('should apply info variant styles', () => {
      render(<Badge data-testid="badge" variant="info">Info</Badge>);
      const badge = screen.getByTestId('badge');
      
      expect(badge).toHaveClass('border-transparent');
      expect(badge).toHaveClass('bg-blue-500');
      expect(badge).toHaveClass('text-white');
      expect(badge).toHaveClass('hover:bg-blue-600');
    });

    it('should apply muted variant styles', () => {
      render(<Badge data-testid="badge" variant="muted">Muted</Badge>);
      const badge = screen.getByTestId('badge');
      
      expect(badge).toHaveClass('border-transparent');
      expect(badge).toHaveClass('bg-gray-100');
      expect(badge).toHaveClass('text-gray-600');
      expect(badge).toHaveClass('hover:bg-gray-200');
    });
  });

  describe('Custom Styling', () => {
    it('should merge custom className with variant classes', () => {
      render(
        <Badge data-testid="badge" variant="success" className="custom-badge-class">
          Custom
        </Badge>
      );
      const badge = screen.getByTestId('badge');
      
      expect(badge).toHaveClass('custom-badge-class');
      expect(badge).toHaveClass('bg-green-500');
      expect(badge).toHaveClass('rounded-full');
    });

    it('should allow overriding of default styles', () => {
      render(
        <Badge data-testid="badge" className="bg-purple-500 text-white">
          Override
        </Badge>
      );
      const badge = screen.getByTestId('badge');
      
      expect(badge).toHaveClass('bg-purple-500');
      expect(badge).toHaveClass('text-white');
    });
  });

  describe('Functionality', () => {
    it('should render children content', () => {
      render(<Badge data-testid="badge">Badge Text</Badge>);
      const badge = screen.getByTestId('badge');
      
      expect(badge).toHaveTextContent('Badge Text');
    });

    it('should render as a div element', () => {
      render(<Badge data-testid="badge">Test</Badge>);
      const badge = screen.getByTestId('badge');
      
      expect(badge.tagName).toBe('DIV');
    });

    it('should pass through HTML attributes', () => {
      render(
        <Badge 
          data-testid="badge" 
          aria-label="Status badge"
          title="Badge title"
        >
          Status
        </Badge>
      );
      const badge = screen.getByTestId('badge');
      
      expect(badge).toHaveAttribute('aria-label', 'Status badge');
      expect(badge).toHaveAttribute('title', 'Badge title');
    });

    it('should render with complex children', () => {
      render(
        <Badge data-testid="badge">
          <span>Icon</span> Text
        </Badge>
      );
      const badge = screen.getByTestId('badge');
      
      expect(badge).toHaveTextContent('Icon Text');
    });
  });

  describe('badgeVariants utility', () => {
    it('should generate correct class string for default variant', () => {
      const classes = badgeVariants({ variant: 'default' });
      expect(classes).toContain('bg-primary-500');
      expect(classes).toContain('text-white');
    });

    it('should generate correct class string for success variant', () => {
      const classes = badgeVariants({ variant: 'success' });
      expect(classes).toContain('bg-green-500');
    });

    it('should use default variant when no variant specified', () => {
      const classes = badgeVariants();
      expect(classes).toContain('bg-primary-500');
    });
  });
});
