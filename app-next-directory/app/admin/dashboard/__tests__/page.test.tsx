import { render, screen } from '@testing-library/react';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/admin/analytics', () => ({
  fetchAdminAnalytics: jest.fn(),
  createEmptyRoleCounts: jest.fn(() => ({
    admin: 0,
    user: 0,
    moderator: 0,
    editor: 0,
    venueOwner: 0,
    superAdmin: 0,
    contentEditor: 0,
    unidentifiedUser: 0,
  })),
}));

jest.mock('@/lib/logger', () => ({
  structuredLogger: {
    error: jest.fn(),
  },
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
const mockLogger = jest.requireMock('@/lib/logger').structuredLogger as {
  error: jest.Mock;
};

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
    mockLogger.error.mockReset();
  });

  it('renders simplified dashboard message', async () => {
    const AdminDashboardPage = (await import('../page')).default;
    const element = await AdminDashboardPage();
    render(element);

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(
      screen.getByText(/temporarily simplified during the Next.js 16 Cache Components migration/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Manage Users')).toBeInTheDocument();
    expect(screen.getByText('Manage Listings')).toBeInTheDocument();
    expect(screen.getByText('Back to Site')).toBeInTheDocument();
  });

  it('has correct navigation links', async () => {
    const AdminDashboardPage = (await import('../page')).default;
    const element = await AdminDashboardPage();
    render(element);

    const usersLink = screen.getByText('Manage Users').closest('a');
    const listingsLink = screen.getByText('Manage Listings').closest('a');
    const homeLink = screen.getByText('Back to Site').closest('a');

    expect(usersLink).toHaveAttribute('href', '/admin/users');
    expect(listingsLink).toHaveAttribute('href', '/admin/listings');
    expect(homeLink).toHaveAttribute('href', '/');
  });
});
