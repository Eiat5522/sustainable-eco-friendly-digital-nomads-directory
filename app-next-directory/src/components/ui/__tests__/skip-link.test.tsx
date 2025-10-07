import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SkipLink } from '../skip-link';

describe('SkipLink', () => {
  describe('Styling and CSS Classes', () => {
    it('should apply base CSS classes for accessibility', () => {
      render(<SkipLink data-testid="skip-link" />);
      const link = screen.getByTestId('skip-link');
      
      expect(link).toHaveClass('sr-only');
      expect(link).toHaveClass('focus:not-sr-only');
      expect(link).toHaveClass('absolute');
      expect(link).toHaveClass('left-0');
      expect(link).toHaveClass('top-0');
      expect(link).toHaveClass('z-50');
    });

    it('should apply background and text color classes', () => {
      render(<SkipLink data-testid="skip-link" />);
      const link = screen.getByTestId('skip-link');
      
      expect(link).toHaveClass('bg-primary');
      expect(link).toHaveClass('text-primary-foreground');
    });

    it('should apply padding and typography classes', () => {
      render(<SkipLink data-testid="skip-link" />);
      const link = screen.getByTestId('skip-link');
      
      expect(link).toHaveClass('px-4');
      expect(link).toHaveClass('py-2');
      expect(link).toHaveClass('text-sm');
      expect(link).toHaveClass('font-medium');
    });

    it('should apply focus ring styles', () => {
      render(<SkipLink data-testid="skip-link" />);
      const link = screen.getByTestId('skip-link');
      
      expect(link).toHaveClass('focus:outline-none');
      expect(link).toHaveClass('focus:ring-2');
      expect(link).toHaveClass('focus:ring-ring');
      expect(link).toHaveClass('focus:ring-offset-2');
    });

    it('should apply transition classes', () => {
      render(<SkipLink data-testid="skip-link" />);
      const link = screen.getByTestId('skip-link');
      
      expect(link).toHaveClass('transition-transform');
    });

    it('should merge custom className with default classes', () => {
      render(<SkipLink data-testid="skip-link" className="custom-skip-class" />);
      const link = screen.getByTestId('skip-link');
      
      expect(link).toHaveClass('custom-skip-class');
      expect(link).toHaveClass('sr-only');
      expect(link).toHaveClass('focus:not-sr-only');
    });
  });

  describe('Functionality', () => {
    it('should render with default text', () => {
      render(<SkipLink data-testid="skip-link" />);
      const link = screen.getByTestId('skip-link');
      
      expect(link).toHaveTextContent('Skip to main content');
    });

    it('should render with custom text', () => {
      render(<SkipLink data-testid="skip-link">Skip to navigation</SkipLink>);
      const link = screen.getByTestId('skip-link');
      
      expect(link).toHaveTextContent('Skip to navigation');
    });

    it('should have correct href with default targetId', () => {
      render(<SkipLink data-testid="skip-link" />);
      const link = screen.getByTestId('skip-link');
      
      expect(link).toHaveAttribute('href', '#main-content');
    });

    it('should have correct href with custom targetId', () => {
      render(<SkipLink data-testid="skip-link" targetId="custom-section" />);
      const link = screen.getByTestId('skip-link');
      
      expect(link).toHaveAttribute('href', '#custom-section');
    });

    it('should support ref forwarding', () => {
      const ref = React.createRef<HTMLAnchorElement>();
      render(<SkipLink ref={ref} />);
      
      expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
    });

    it('should render as an anchor tag', () => {
      render(<SkipLink data-testid="skip-link" />);
      const link = screen.getByTestId('skip-link');
      
      expect(link.tagName).toBe('A');
    });

    it('should pass through additional HTML attributes', () => {
      render(
        <SkipLink 
          data-testid="skip-link" 
          aria-label="Skip to main content area"
          title="Skip link"
        />
      );
      const link = screen.getByTestId('skip-link');
      
      expect(link).toHaveAttribute('aria-label', 'Skip to main content area');
      expect(link).toHaveAttribute('title', 'Skip link');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <SkipLink data-testid="skip-link" />
          <main id="main-content">Main content</main>
        </div>
      );
      const link = screen.getByTestId('skip-link');
      
      await user.tab();
      expect(link).toHaveFocus();
    });

    it('should be screen reader friendly with sr-only class', () => {
      render(<SkipLink data-testid="skip-link" />);
      const link = screen.getByTestId('skip-link');
      
      // The sr-only class makes it invisible but accessible to screen readers
      expect(link).toHaveClass('sr-only');
      expect(link).toBeInTheDocument();
    });
  });
});
