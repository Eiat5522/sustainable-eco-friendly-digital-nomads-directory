import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/admin/analytics', () => ({
  fetchAdminAnalytics: jest.fn(),
}));

const redirectMock = jest.fn();

jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

jest.mock('../ModerationActions', () => ({
  ModerationActions: ({ moderationId }: { moderationId: string }) => (
    <div data-testid={`moderation-actions-${moderationId}`} />
  ),
}));

const mockAuth = jest.requireMock('@/lib/auth').auth as jest.Mock;
const mockFetchAnalytics = jest.requireMock('@/lib/admin/analytics')
  .fetchAdminAnalytics as jest.Mock;

const buildSnapshot = () => ({
  overview: {
    totalUsers: 150,
    totalListings: 45,
    totalReviews: 320,
    weeklySignups: 12,
    pendingModeration: 3,
  },
  userRoles: { admin: 2, user: 148 },
  moderationQueue: [
    {
      id: 'queue-1',
      itemName: 'Eco Stay',
      itemId: 'listing-1',
      itemType: 'listing',
      reports: 2,
      lastActivity: new Date().toISOString(),
      status: 'pending',
    },
  ],
  generatedAt: new Date().toISOString(),
});

describe('AdminDashboardPage', () => {
beforeEach(() => {
  jest.clearAllMocks();
});

  it('renders analytics overview for admin users', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'admin-1', role: 'admin' },
    });
    const snapshot = buildSnapshot();
    mockFetchAnalytics.mockImplementation(async () => snapshot);

    const AdminDashboardPage = (await import('../page')).default;
    const element = await AdminDashboardPage();
    render(<>{element}</>);

    expect(mockFetchAnalytics).toHaveBeenCalledTimes(1);
    expect(await screen.findByTestId('admin-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('admin-dashboard-title')).toHaveTextContent('Admin Dashboard');
    expect(screen.getByTestId('pending-tasks')).toHaveTextContent('3 tasks assigned');
    expect(screen.getByText('Eco Stay')).toBeInTheDocument();
    expect(await screen.findByTestId('moderation-actions-queue-1')).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('shows fallback UI when analytics loading fails', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'admin-2', role: 'admin' },
    });
    mockFetchAnalytics.mockRejectedValueOnce(new Error('boom'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const AdminDashboardPage = (await import('../page')).default;
    const element = await AdminDashboardPage();
    render(<>{element}</>);

    expect(
      screen.getByText(/Unable to load dashboard data/i),
    ).toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });

  it('redirects non-admin users to login', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'user-1', role: 'user' },
    });
    redirectMock.mockImplementation(() => {
      throw new Error('redirect');
    });

    const AdminDashboardPage = (await import('../page')).default;
    await expect(AdminDashboardPage()).rejects.toThrow('redirect');
    expect(redirectMock).toHaveBeenCalledWith('/auth/login?callbackUrl=/admin/dashboard');
  });
});
