/**
 * Unit tests for PageLayoutServer.tsx
 * Tests the server-rendered page layout wrapper
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { PageLayoutServer } from '../PageLayoutServer';

// Mock child components
jest.mock('../HeaderServer', () => ({
  HeaderServer: () => <header data-testid="header-server">Header Server</header>,
}));

jest.mock('../FooterServer', () => ({
  FooterServer: ({ showNewsletter }: { showNewsletter?: boolean }) => (
    <footer data-testid="footer-server" data-show-newsletter={showNewsletter}>
      Footer Server
    </footer>
  ),
}));

jest.mock('@/components/ui/skip-link', () => ({
  SkipLink: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="skip-link">
      {children}
    </a>
  ),
}));

describe('PageLayoutServer', () => {
  it('should render with default props', () => {
    render(
      <PageLayoutServer>
        <div>Test Content</div>
      </PageLayoutServer>
    );

    expect(screen.getByTestId('header-server')).toBeInTheDocument();
    expect(screen.getByTestId('footer-server')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render skip link for accessibility', () => {
    render(
      <PageLayoutServer>
        <div>Content</div>
      </PageLayoutServer>
    );

    const skipLink = screen.getByTestId('skip-link');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(skipLink).toHaveTextContent('Skip to main content');
  });

  it('should render main content with proper id', () => {
    const { container } = render(
      <PageLayoutServer>
        <div>Main Content</div>
      </PageLayoutServer>
    );

    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute('id', 'main-content');
    expect(main).toHaveAttribute('tabIndex', '-1');
    expect(main).toHaveTextContent('Main Content');
  });

  it('should pass showFooterNewsletter prop to FooterServer', () => {
    render(
      <PageLayoutServer showFooterNewsletter={false}>
        <div>Content</div>
      </PageLayoutServer>
    );

    const footer = screen.getByTestId('footer-server');
    expect(footer).toHaveAttribute('data-show-newsletter', 'false');
  });

  it('should default showFooterNewsletter to true', () => {
    render(
      <PageLayoutServer>
        <div>Content</div>
      </PageLayoutServer>
    );

    const footer = screen.getByTestId('footer-server');
    expect(footer).toHaveAttribute('data-show-newsletter', 'true');
  });

  it('should apply custom className to root container', () => {
    const { container } = render(
      <PageLayoutServer className="custom-class another-class">
        <div>Content</div>
      </PageLayoutServer>
    );

    const rootDiv = container.firstChild;
    expect(rootDiv).toHaveClass('custom-class', 'another-class', 'min-h-screen', 'bg-background');
  });

  it('should maintain default classes when no custom className', () => {
    const { container } = render(
      <PageLayoutServer>
        <div>Content</div>
      </PageLayoutServer>
    );

    const rootDiv = container.firstChild;
    expect(rootDiv).toHaveClass('min-h-screen', 'bg-background');
  });

  it('should render children inside main element', () => {
    render(
      <PageLayoutServer>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </PageLayoutServer>
    );

    const main = screen.getByRole('main');
    expect(main).toContainElement(screen.getByTestId('child-1'));
    expect(main).toContainElement(screen.getByTestId('child-2'));
  });

  it('should have proper semantic structure', () => {
    const { container } = render(
      <PageLayoutServer>
        <div>Content</div>
      </PageLayoutServer>
    );

    // Check for proper landmark structure
    expect(container.querySelector('header')).toBeInTheDocument();
    expect(container.querySelector('main')).toBeInTheDocument();
    expect(container.querySelector('footer')).toBeInTheDocument();
  });

  it('should render empty children without errors', () => {
    render(<PageLayoutServer>{null}</PageLayoutServer>);

    expect(screen.getByTestId('header-server')).toBeInTheDocument();
    expect(screen.getByTestId('footer-server')).toBeInTheDocument();
  });
});
