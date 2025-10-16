import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';

const redirectMock = jest.fn();

jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

jest.mock('@/components/ui/neo-card', () => ({
  NeoCard: ({ children }: { children: React.ReactNode }) => <div data-testid="neo-card">{children}</div>,
  NeoCardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  NeoCardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  NeoCardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/neo-button', () => ({
  NeoButton: ({ children, asChild = false, ...rest }: { children: React.ReactNode; asChild?: boolean }) =>
    asChild ? <>{children}</> : <button type="button" data-testid="neo-button" {...rest}>{children}</button>,
}));

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/dashboard/user-dashboard', () => ({
  getUserDashboardData: jest.fn(),
}));

beforeEach(() => {
  redirectMock.mockReset();
});

describe('DashboardPage', () => {
  it('redirects unauthenticated users to the login page', async () => {
    redirectMock.mockImplementation(() => {
      const error = new Error('REDIRECT');
      (error as Error & { digest?: string }).digest = 'NEXT_REDIRECT';
      throw error;
    });

    jest.resetModules();
    const [pageModule, authModule, dashboardModule] = await Promise.all([
      import('../dashboard/page'),
      import('@/lib/auth'),
      import('@/lib/dashboard/user-dashboard'),
    ]);

    const auth = authModule.auth as jest.Mock;
    const getUserDashboardData = dashboardModule.getUserDashboardData as jest.Mock;

    auth.mockResolvedValue(null);
    getUserDashboardData.mockResolvedValue(null);

    await expect(pageModule.default()).rejects.toThrow('REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/auth/login?callbackUrl=%2Fdashboard');
    expect(getUserDashboardData).not.toHaveBeenCalled();
  });

  it('renders fallback content when dashboard data is unavailable', async () => {
    redirectMock.mockImplementation(() => {
      throw new Error('redirect should not be called');
    });

    jest.resetModules();
    const [pageModule, authModule, dashboardModule] = await Promise.all([
      import('../dashboard/page'),
      import('@/lib/auth'),
      import('@/lib/dashboard/user-dashboard'),
    ]);

    const auth = authModule.auth as jest.Mock;
    const getUserDashboardData = dashboardModule.getUserDashboardData as jest.Mock;

    auth.mockResolvedValue({ user: { id: 'user-1', role: 'user', name: 'Riley', email: 'riley@example.com' } });
    getUserDashboardData.mockResolvedValue(null);

    const element = await pageModule.default();
    render(element);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(
      screen.getByText(/We could not load your dashboard data right now/i)
    ).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('renders venue owner analytics with formatted metrics', async () => {
    redirectMock.mockImplementation(() => {
      throw new Error('redirect should not occur');
    });

    jest.resetModules();
    const [pageModule, authModule, dashboardModule] = await Promise.all([
      import('../dashboard/page'),
      import('@/lib/auth'),
      import('@/lib/dashboard/user-dashboard'),
    ]);

    const auth = authModule.auth as jest.Mock;
    const getUserDashboardData = dashboardModule.getUserDashboardData as jest.Mock;

    auth.mockResolvedValue({ user: { id: 'owner-1', role: 'venueOwner', name: 'Jamie' } });
    getUserDashboardData.mockResolvedValue({
      user: { id: 'owner-1', role: 'venueOwner', name: 'Jamie', email: null },
      generatedAt: '2024-05-01T00:00:00.000Z',
      range: { months: 3, from: '2024-02-01T00:00:00.000Z', to: '2024-05-01T00:00:00.000Z' },
      data: {
        kind: 'venueOwner',
        listings: [
          {
            listing: { id: 'listing-1', name: 'Eco Stay', slug: 'eco-stay', city: 'Green City' },
            summary: { avgRating: 4.2, reviewCount: 18, favoritesCount: 7, viewCount: null },
            monthly: [
              { month: '2024-03', label: 'Mar 2024', reviewCount: 5, avgRating: 4.5, favoritesCount: 3, monthlyViewCount: 40 },
            ],
            lastUpdated: '2024-04-15T00:00:00.000Z',
          },
        ],
        totals: { avgRating: 4.2, reviewCount: 18, favoritesCount: 7, viewCount: 120 },
        monthlyTotals: [
          { month: '2024-03', label: 'Mar 2024', reviewCount: 5, avgRating: 4.5, favoritesCount: 3, monthlyViewCount: null },
        ],
        notices: ['Analytics refresh is delayed.'],
      },
    });

    const element = await pageModule.default();
    render(element);

    expect(screen.getByTestId('user-dashboard')).toBeInTheDocument();
    expect(screen.getByText('Listing performance')).toBeInTheDocument();
    expect(screen.getAllByText('4.20').length).toBeGreaterThan(0);
    expect(screen.getAllByText('—').length).toBeGreaterThan(0); // view count null fallback
    expect(screen.getByText('Analytics refresh is delayed.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Manage Listings' })).toHaveAttribute(
      'href',
      '/dashboard/listings'
    );
  });

  it('renders regular user activity with favourites table', async () => {
    redirectMock.mockImplementation(() => {
      throw new Error('redirect should not occur');
    });

    jest.resetModules();
    const [pageModule, authModule, dashboardModule] = await Promise.all([
      import('../dashboard/page'),
      import('@/lib/auth'),
      import('@/lib/dashboard/user-dashboard'),
    ]);

    const auth = authModule.auth as jest.Mock;
    const getUserDashboardData = dashboardModule.getUserDashboardData as jest.Mock;

    auth.mockResolvedValue({ user: { id: 'user-5', role: 'user', name: 'Morgan' } });
    getUserDashboardData.mockResolvedValue({
      user: { id: 'user-5', role: 'user', name: 'Morgan', email: null },
      generatedAt: '2024-04-20T00:00:00.000Z',
      range: { months: 3, from: '2024-01-20T00:00:00.000Z', to: '2024-04-20T00:00:00.000Z' },
      data: {
        kind: 'user',
        metrics: { favoritesCount: 3, reviewsWritten: 1, avgRatingGiven: 4.5 },
        favorites: [
          {
            id: 'fav-1',
            createdAt: '2024-03-01T00:00:00.000Z',
            listing: { id: 'listing-8', name: 'Eco Stay', slug: 'eco-stay', city: 'Test City' },
          },
        ],
        monthly: [
          { month: '2024-02', label: 'Feb 2024', reviewCount: 1, avgRating: 4.5, favoritesCount: 1, monthlyViewCount: null },
        ],
      },
    });

    const element = await pageModule.default();
    render(element);

    expect(screen.getByText('Your activity')).toBeInTheDocument();
    expect(screen.getByText('Saved favourites')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Eco Stay')).toBeInTheDocument();
    expect(screen.getByText('Test City')).toBeInTheDocument();
    expect(screen.getAllByText('4.50').length).toBeGreaterThan(0);
  });
});
