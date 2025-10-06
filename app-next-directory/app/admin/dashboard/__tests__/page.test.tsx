import { describe, it, expect, beforeEach, jest, beforeAll } from '@jest/globals';
import { render, screen, within, act } from '@testing-library/react';

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  auth: jest.fn(),
}));

jest.mock('@/lib/admin/analytics', () => ({
  __esModule: true,
  fetchAdminAnalytics: jest.fn(),
}));

const authMockModule = jest.requireMock('@/lib/auth') as { auth: jest.Mock };
const analyticsMockModule = jest.requireMock('@/lib/admin/analytics') as {
  fetchAdminAnalytics: jest.Mock;
};

let AdminDashboardPage: (typeof import('../page'))['default'];
let metadata: (typeof import('../page'))['metadata'];
let dynamic: (typeof import('../page'))['dynamic'];

const mockAuth = authMockModule.auth;
const mockFetchAnalytics = analyticsMockModule.fetchAdminAnalytics;

const analyticsFixture = {
  overview: {
    totalUsers: 1234,
    totalListings: 345,
    totalReviews: 678,
    weeklySignups: 12,
    pendingModeration: 3,
  },
  userRoles: { admin: 2, user: 1200 },
  moderationQueue: [
    {
      id: 'queue-1',
      itemType: 'listing',
      itemName: 'Eco Retreat',
      itemId: 'listing-123',
      reports: 2,
      lastActivity: '2024-01-10T10:00:00.000Z',
      status: 'pending',
    },
  ],
  generatedAt: '2024-01-11T10:00:00.000Z',
};

beforeAll(async () => {
  const pageModule = await import('../page');
  AdminDashboardPage = pageModule.default;
  metadata = pageModule.metadata;
  dynamic = pageModule.dynamic;
});

describe('Admin dashboard metadata', () => {
  it('exports static generation flags for the route', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('prevents indexing of the admin dashboard', () => {
    expect(metadata).toEqual({
      title: 'Admin Dashboard',
      robots: { index: false, follow: false },
    });
  });
});

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockFetchAnalytics.mockReset();
    mockAuth.mockResolvedValue({ user: { role: 'admin', id: 'admin-1' } } as any);
    mockFetchAnalytics.mockResolvedValue(analyticsFixture);
  });

  it('renders the main shell and header information', async () => {
    await act(async () => {
      const ui = await AdminDashboardPage();
      render(ui);
    });

    expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('admin-dashboard-title')).toHaveTextContent('Admin Dashboard');
    expect(screen.getByText('Monitor community health and moderate member activity.')).toBeInTheDocument();
    expect(screen.getByText(/Last refresh/i)).toBeInTheDocument();
    expect(screen.getByTestId('pending-tasks')).toHaveTextContent('3 tasks assigned');
  });

  it('lists analytics highlight cards with their metrics', async () => {
    await act(async () => {
      const ui = await AdminDashboardPage();
      render(ui);
    });

    const analyticsSection = screen.getByTestId('analytics-overview');
    const highlightCards = within(analyticsSection).getAllByRole('article');
    expect(highlightCards.length).toBeGreaterThanOrEqual(4);

    const expectedTitles = ['Active members', 'Total listings', 'Weekly signups', 'Items pending review'];
    expectedTitles.forEach((title) => {
      expect(within(analyticsSection).getByText(title)).toBeInTheDocument();
    });

    const valueElements = within(analyticsSection).getAllByTestId('analytics-card-value');
    expect(valueElements).toHaveLength(4);
  });

  it('renders the moderation queue table with actions', async () => {
    await act(async () => {
      const ui = await AdminDashboardPage();
      render(ui);
    });

    const moderationSection = screen.getByTestId('moderation-tools');
    const table = within(moderationSection).getByRole('table');

    const headers = within(table).getAllByRole('columnheader');
    expect(headers.map((header) => header.textContent?.trim())).toEqual([
      'Item',
      'Type',
      'Reports',
      'Last activity',
      'Status',
      'Actions',
    ]);

    expect(screen.getByRole('button', { name: /approve eco retreat/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /restrict eco retreat/i })).toBeInTheDocument();
  });
});
