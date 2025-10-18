import { describe, it, expect, beforeEach, jest, beforeAll, afterEach } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('next/navigation', () => ({
  __esModule: true,
  redirect: jest.fn(),
}));

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
const navigationMockModule = jest.requireMock('next/navigation') as { redirect: jest.Mock };

let AdminDashboardPage: (typeof import('../page'))['default'];
let metadata: (typeof import('../page'))['metadata'];
let dynamic: (typeof import('../page'))['dynamic'];

const mockAuth = authMockModule.auth;
const mockFetchAnalytics = analyticsMockModule.fetchAdminAnalytics;
const mockRedirect = navigationMockModule.redirect;

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

afterEach(() => {
  mockRedirect.mockReset();
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
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    mockAuth.mockReset();
    mockFetchAnalytics.mockReset();
    mockAuth.mockResolvedValue({ user: { role: 'admin', id: 'admin-1' } } as any);
    mockFetchAnalytics.mockResolvedValue(analyticsFixture);
  });

  it('renders the main shell and header information', async () => {
    const ui = await AdminDashboardPage();
    render(ui);

    expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('admin-dashboard-title')).toHaveTextContent('Admin Dashboard');
    expect(screen.getByText('Monitor community health and moderate member activity.')).toBeInTheDocument();
    expect(screen.getByText(/Last refresh/i)).toBeInTheDocument();
    expect(screen.getByTestId('pending-tasks')).toHaveTextContent('3 tasks assigned');
  });

  it('lists analytics highlight cards with their metrics', async () => {
    const ui = await AdminDashboardPage();
    render(ui);

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
    const ui = await AdminDashboardPage();
    render(ui);

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
  it('shows a friendly empty state when the moderation queue is clear', async () => {
    mockFetchAnalytics.mockResolvedValueOnce({
      ...analyticsFixture,
      overview: { ...analyticsFixture.overview, pendingModeration: 0 },
      moderationQueue: [],
    });

    const ui = await AdminDashboardPage();
    render(ui);

    expect(screen.getByTestId('queue-summary')).toHaveTextContent('Queue is clear — great job!');
    expect(screen.getByText('No items pending moderation')).toBeInTheDocument();
  });

  it('normalises moderation statuses and falls back for unknown states', async () => {
    mockFetchAnalytics.mockResolvedValueOnce({
      ...analyticsFixture,
      moderationQueue: [
        {
          ...analyticsFixture.moderationQueue[0],
          id: 'queue-unknown',
          status: 'mystery_state',
        },
      ],
    });

    const ui = await AdminDashboardPage();
    render(ui);

    const badge = screen.getByRole('status', { name: /Moderation status/i });
    expect(badge).toHaveTextContent('Mystery State');
    expect(badge.className).toContain('bg-gray-50');
  });

  it('renders a loading fallback when analytics fail to load', async () => {
    mockFetchAnalytics.mockRejectedValueOnce(new Error('boom'));

    const ui = await AdminDashboardPage();
    render(ui);

    expect(
      screen.getByText('Unable to load dashboard data. Please try again later.')
    ).toBeInTheDocument();
  });

  it('redirects non-admin users to the login page', async () => {
    mockAuth.mockResolvedValueOnce({ user: { role: 'user', id: 'user-123' } } as any);
    mockRedirect.mockImplementationOnce((url: string) => {
      throw new Error(`redirect:${url}`);
    });

    await expect(AdminDashboardPage()).rejects.toThrow(
      'redirect:/auth/login?callbackUrl=/admin/dashboard'
    );
    expect(mockRedirect).toHaveBeenCalledWith('/auth/login?callbackUrl=/admin/dashboard');
  });

  it('shows human friendly relative times including "Just now" and "Unknown" states', async () => {
    jest.useFakeTimers();
    const frozenDate = new Date('2024-02-20T10:00:00Z');
    jest.setSystemTime(frozenDate);

    mockFetchAnalytics.mockResolvedValueOnce({
      ...analyticsFixture,
      generatedAt: frozenDate.toISOString(),
      moderationQueue: [
        {
          ...analyticsFixture.moderationQueue[0],
          lastActivity: frozenDate.toISOString(),
        },
        {
          ...analyticsFixture.moderationQueue[0],
          id: 'queue-older',
          lastActivity: '2024-02-18T10:00:00Z',
        },
      ],
    });

    const ui = await AdminDashboardPage();
    render(ui);

    expect(screen.getByText(/Last refresh: Just now/)).toBeInTheDocument();
    expect(screen.getByText('Just now')).toBeInTheDocument();
    expect(screen.getByText('2d ago')).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('falls back to Unknown when timestamps cannot be parsed', async () => {
    mockFetchAnalytics.mockResolvedValueOnce({
      ...analyticsFixture,
      generatedAt: 'definitely-not-a-date',
      moderationQueue: [
        {
          ...analyticsFixture.moderationQueue[0],
          lastActivity: 'not-a-date-either',
        },
      ],
    });

    const ui = await AdminDashboardPage();
    render(ui);

    expect(screen.getByText(/Last refresh: Unknown/)).toBeInTheDocument();
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('allows moderators to open, edit, and close the notes panel from the queue', async () => {
    const ui = await AdminDashboardPage();
    render(ui);

    const notesButton = screen.getByRole('button', { name: /View notes for Eco Retreat/i });
    await user.click(notesButton);

    const textarea = screen.getByRole('textbox', { name: /Moderator notes/i });
    await user.type(textarea, 'Needs follow up');
    expect(textarea).toHaveValue('Needs follow up');

    await user.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(screen.queryByRole('textbox', { name: /Moderator notes/i })).not.toBeInTheDocument();
  });
});
