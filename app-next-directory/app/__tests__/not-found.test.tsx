import { render, screen } from '@testing-library/react';
import NotFound from '../not-found';

// Mock PageLayout to simplify testing
jest.mock('@/components/layout/PageLayout', () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="page-layout">{children}</div>,
}));

// Mock Link as it's a Next.js component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('NotFound Page', () => {
  it('renders the 404 message and home link', () => {
    render(<NotFound />);

    expect(screen.getByText('404 - Page Not Found')).toBeInTheDocument();
    expect(screen.getByText(/Sorry, we couldn't find the page you're looking for/i)).toBeInTheDocument();

    const homeLink = screen.getByRole('link', { name: /go back home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders within PageLayout', () => {
    render(<NotFound />);
    expect(screen.getByTestId('page-layout')).toBeInTheDocument();
  });
});
