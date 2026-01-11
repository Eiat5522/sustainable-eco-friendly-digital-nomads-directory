/**
 * Unit tests for UserAuthStatus.tsx
 * Tests the server component that fetches auth status and wraps it in Suspense
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import UserAuthStatus from '../UserAuthStatus';

// Mock HeaderAuthClient
jest.mock('../HeaderAuthClient', () => ({
  HeaderAuthClient: ({
    isAuthenticated,
    isAdmin,
  }: {
    isAuthenticated: boolean;
    isAdmin: boolean;
  }) => (
    <div data-testid="header-auth-client">
      <span data-testid="is-authenticated">{String(isAuthenticated)}</span>
      <span data-testid="is-admin">{String(isAdmin)}</span>
    </div>
  ),
}));

// Mock auth DAL - note these are async functions
jest.mock('@/lib/data-access/auth.dal', () => ({
  getAuthStatus: jest.fn().mockResolvedValue({ isAuthenticated: true, isAdmin: false }),
  getUserDisplayInfo: jest.fn().mockResolvedValue({ displayName: 'Test User' }),
}));

describe('UserAuthStatus', () => {
  it('should render Suspense wrapper with fallback', () => {
    render(<UserAuthStatus />);

    // The component always renders a Suspense wrapper
    const container = screen.getByRole('status', { hidden: true });
    expect(container).toBeInTheDocument();
  });

  it('should render loading skeleton with proper accessibility attributes', () => {
    render(<UserAuthStatus />);

    const skeleton = screen.getByRole('status', { hidden: true });
    expect(skeleton).toHaveAttribute('aria-busy', 'true');

    const srText = screen.getByText('Loading authentication status');
    expect(srText).toHaveClass('sr-only');
  });

  it('should apply custom className to skeleton', () => {
    const { container } = render(<UserAuthStatus className="custom-class" />);

    const skeletonContainer = container.querySelector('.custom-class');
    expect(skeletonContainer).toBeInTheDocument();
  });

  it('should have proper skeleton styling', () => {
    render(<UserAuthStatus />);

    const skeleton = screen.getByRole('status', { hidden: true });
    expect(skeleton).toHaveClass(
      'inline-flex',
      'w-10',
      'h-10',
      'bg-gray-200',
      'animate-pulse',
      'rounded-full'
    );
  });

  it('should render HeaderAuthClient with mocked auth data after loading', async () => {
    render(<UserAuthStatus />);

    const authClient = await screen.findByTestId('header-auth-client');
    expect(authClient).toBeInTheDocument();

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
  });
});
