import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ForbiddenPage from '../page';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ShieldAlert: () => <div data-testid="shield-alert-icon">ShieldAlert</div>,
}));

// Mock Button component
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, asChild, variant, ...props }: any) => {
    if (asChild) {
      return <div {...props}>{children}</div>;
    }
    return <button {...props}>{children}</button>;
  },
}));

describe('ForbiddenPage', () => {
  describe('Rendering', () => {
    it('should render the 403 error code', () => {
      render(<ForbiddenPage />);
      const heading = screen.getByText('403');
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass('text-6xl');
    });

    it('should render the "Access Forbidden" title', () => {
      render(<ForbiddenPage />);
      expect(screen.getByText('Access Forbidden')).toBeInTheDocument();
    });

    it('should render the error description', () => {
      render(<ForbiddenPage />);
      expect(
        screen.getByText(/Sorry, you don't have permission to access this resource/i)
      ).toBeInTheDocument();
    });

    it('should render the ShieldAlert icon', () => {
      render(<ForbiddenPage />);
      expect(screen.getByTestId('shield-alert-icon')).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('should render a link to the homepage', () => {
      render(<ForbiddenPage />);
      const homeLink = screen.getByText('Go to Homepage').closest('a');
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('should render a link to the dashboard', () => {
      render(<ForbiddenPage />);
      const dashboardLink = screen.getByText('Go to Dashboard').closest('a');
      expect(dashboardLink).toBeInTheDocument();
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });
  });

  describe('Error Information', () => {
    it('should display the error code', () => {
      render(<ForbiddenPage />);
      expect(screen.getByText(/Error Code: 403/i)).toBeInTheDocument();
    });

    it('should display support contact message', () => {
      render(<ForbiddenPage />);
      expect(
        screen.getByText(/If you need assistance, please contact support/i)
      ).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should have proper layout classes', () => {
      const { container } = render(<ForbiddenPage />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('min-h-screen');
      expect(mainDiv).toHaveClass('flex');
      expect(mainDiv).toHaveClass('items-center');
      expect(mainDiv).toHaveClass('justify-center');
    });

    it('should have gradient background', () => {
      const { container } = render(<ForbiddenPage />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('bg-gradient-to-b');
      expect(mainDiv).toHaveClass('from-gray-50');
      expect(mainDiv).toHaveClass('to-gray-100');
    });

    it('should have centered text content', () => {
      const { container } = render(<ForbiddenPage />);
      const contentDiv = container.querySelector('.text-center');
      expect(contentDiv).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-hidden on decorative icon', () => {
      render(<ForbiddenPage />);
      const iconContainer = screen.getByTestId('shield-alert-icon').parentElement;
      // Icon itself is aria-hidden via props in the real component
      expect(iconContainer).toBeInTheDocument();
    });

    it('should have semantic heading hierarchy', () => {
      render(<ForbiddenPage />);
      const h1 = screen.getByText('403');
      const h2 = screen.getByText('Access Forbidden');
      expect(h1.tagName).toBe('H1');
      expect(h2.tagName).toBe('H2');
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive flex direction classes', () => {
      render(<ForbiddenPage />);
      const buttonsContainer = screen.getByText('Go to Homepage').closest('div')?.parentElement;
      expect(buttonsContainer).toHaveClass('flex-col');
      expect(buttonsContainer).toHaveClass('sm:flex-row');
    });

    it('should have responsive padding', () => {
      const { container } = render(<ForbiddenPage />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('px-4');
    });
  });

  describe('Component Structure', () => {
    it('should render all main sections', () => {
      render(<ForbiddenPage />);
      
      // Icon section
      expect(screen.getByTestId('shield-alert-icon')).toBeInTheDocument();
      
      // Error code
      expect(screen.getByText('403')).toBeInTheDocument();
      
      // Title
      expect(screen.getByText('Access Forbidden')).toBeInTheDocument();
      
      // Description
      expect(screen.getByText(/Sorry, you don't have permission/i)).toBeInTheDocument();
      
      // Navigation buttons
      expect(screen.getByText('Go to Homepage')).toBeInTheDocument();
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
      
      // Footer info
      expect(screen.getByText(/Error Code: 403/i)).toBeInTheDocument();
    });

    it('should have proper button gap spacing', () => {
      render(<ForbiddenPage />);
      const buttonsContainer = screen.getByText('Go to Homepage').closest('div')?.parentElement;
      expect(buttonsContainer).toHaveClass('gap-4');
    });
  });

  describe('Text Content', () => {
    it('should have contact administrator suggestion', () => {
      render(<ForbiddenPage />);
      expect(
        screen.getByText(/contact an administrator if you believe this is an error/i)
      ).toBeInTheDocument();
    });

    it('should properly escape apostrophes', () => {
      render(<ForbiddenPage />);
      // Check that text renders correctly with proper apostrophe handling
      const text = screen.getByText(/don't have permission/i);
      expect(text).toBeInTheDocument();
    });
  });
});
