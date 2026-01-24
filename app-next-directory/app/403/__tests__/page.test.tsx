import { render, screen } from '@testing-library/react';
import type React from 'react';
import ForbiddenPage from '../page';

jest.mock('@/components/layout/PageLayout', () => ({
  PageLayout: ({
    children,
    showFooterNewsletter,
  }: {
    children: React.ReactNode;
    showFooterNewsletter: boolean;
  }) => (
    <div data-testid="page-layout" data-show-footer-newsletter={showFooterNewsletter}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/neo-button', () => ({
  NeoButton: ({
    children,
    asChild,
    variant,
    size,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
    variant?: string;
    size?: string;
  }) => (
    <div data-testid="neo-button" data-variant={variant} data-size={size} data-as-child={asChild}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/neo-card', () => ({
  NeoCard: ({
    children,
    variant,
    className,
  }: {
    children: React.ReactNode;
    variant?: string;
    className?: string;
  }) => (
    <div data-testid="neo-card" data-variant={variant} className={className}>
      {children}
    </div>
  ),
  NeoCardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="neo-card-header">{children}</div>
  ),
  NeoCardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h2 data-testid="neo-card-title" className={className}>
      {children}
    </h2>
  ),
  NeoCardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="neo-card-content">{children}</div>
  ),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a data-testid="next-link" href={href}>
      {children}
    </a>
  ),
}));

describe('ForbiddenPage', () => {
  it('renders the 403 forbidden page', () => {
    render(<ForbiddenPage />);

    expect(screen.getByTestId('page-layout')).toBeInTheDocument();
    expect(screen.getByTestId('page-layout')).toHaveAttribute(
      'data-show-footer-newsletter',
      'false'
    );
  });

  it('displays the 403 error message', () => {
    render(<ForbiddenPage />);

    expect(screen.getByTestId('neo-card-title')).toHaveTextContent('403 - Access Denied');
    expect(screen.getByText(/You don't have permission to view this page\./i)).toBeInTheDocument();
  });

  it('renders the NeoCard with elevated variant', () => {
    render(<ForbiddenPage />);

    const neoCard = screen.getByTestId('neo-card');
    expect(neoCard).toBeInTheDocument();
    expect(neoCard).toHaveAttribute('data-variant', 'elevated');
  });

  it('renders the card with relative positioning', () => {
    render(<ForbiddenPage />);

    const card = screen.getByTestId('neo-card');
    expect(card).toHaveClass('relative');
  });

  it('renders the go back home link', () => {
    render(<ForbiddenPage />);

    const link = screen.getByTestId('next-link');
    expect(link).toHaveAttribute('href', '/');
    expect(link).toHaveTextContent('Go back home');
  });

  it('renders the go back home button with correct styling', () => {
    render(<ForbiddenPage />);

    const button = screen.getByTestId('neo-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('data-variant', 'primary');
    expect(button).toHaveAttribute('data-size', 'lg');
    expect(button).toHaveAttribute('data-as-child', 'true');
  });

  it('renders all card sections', () => {
    render(<ForbiddenPage />);

    expect(screen.getByTestId('neo-card-header')).toBeInTheDocument();
    expect(screen.getByTestId('neo-card-title')).toBeInTheDocument();
    expect(screen.getByTestId('neo-card-content')).toBeInTheDocument();
  });

  it('contains the gradient background styling', () => {
    render(<ForbiddenPage />);

    const card = screen.getByTestId('neo-card');
    expect(card).toHaveClass('relative');
  });

  it('shows the correct error title with styling classes', () => {
    render(<ForbiddenPage />);

    const title = screen.getByTestId('neo-card-title');
    expect(title).toHaveClass('heading-xl', 'mb-2', 'text-neo-text-primary');
  });
});
