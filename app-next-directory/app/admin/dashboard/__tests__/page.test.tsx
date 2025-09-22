import { render, screen, within } from '@testing-library/react';
import AdminDashboardPage, { dynamic, metadata } from '../page';

describe('Admin dashboard metadata', () => {
  it('exports static generation flags for the route', () => {
    expect(dynamic).toBe('force-static');
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
    render(<AdminDashboardPage />);
  });

  it('renders the main shell and header information', () => {
    const dashboard = screen.getByTestId('admin-dashboard');
    expect(dashboard).toBeInTheDocument();

    expect(screen.getByTestId('admin-dashboard-title')).toHaveTextContent('Admin Dashboard');
    expect(
      screen.getByText('Monitor community health and moderate member activity.')
    ).toBeInTheDocument();
    expect(screen.getByText('Last refresh')).toBeInTheDocument();
    expect(screen.getByText('12 minutes ago')).toBeInTheDocument();
    expect(screen.getByText('6 tasks assigned')).toBeInTheDocument();
    expect(screen.getByText('SLA: 8h')).toBeInTheDocument();
  });

  it('lists all analytics highlight cards with their metrics', () => {
    const expectedHighlights = [
      { title: 'Active members', value: '12,450', change: '+5.2%' },
      { title: 'Listings awaiting review', value: '132', change: '-12%' },
      { title: 'Weekly signups', value: '486', change: '+8.4%' },
      { title: 'Open support requests', value: '27', change: '-3' },
    ];

    const analyticsSection = screen.getByTestId('analytics-overview');
    const highlightCards = within(analyticsSection).getAllByRole('article');
    expect(highlightCards).toHaveLength(expectedHighlights.length);

    expectedHighlights.forEach((highlight) => {
      const card = within(analyticsSection)
        .getByText(highlight.title)
        .closest('article');
      expect(card).not.toBeNull();
      const scopedCard = within(card as HTMLElement);
      expect(scopedCard.getByText(highlight.value)).toBeInTheDocument();
      expect(scopedCard.getByText(highlight.change)).toBeInTheDocument();
    });
  });

  it('renders the moderation queue table with the correct entries', () => {
    const expectedQueue = [
      {
        member: 'Aisha Hernandez',
        role: 'Host',
        concern: 'Photo authenticity check',
        reports: '3',
        lastEvent: '2h ago',
        status: 'Under review',
        statusClasses: ['bg-amber-50', 'text-amber-700', 'border-amber-200'],
      },
      {
        member: 'Bruno Igawa',
        role: 'Guest',
        concern: 'Payment dispute resolved',
        reports: '1',
        lastEvent: '5h ago',
        status: 'Ready to close',
        statusClasses: ['bg-emerald-50', 'text-emerald-700', 'border-emerald-200'],
      },
      {
        member: 'Noor Rahman',
        role: 'Host',
        concern: 'Accessibility compliance',
        reports: '4',
        lastEvent: '1d ago',
        status: 'Awaiting response',
        statusClasses: ['bg-sky-50', 'text-sky-700', 'border-sky-200'],
      },
      {
        member: 'Zoé Mateus',
        role: 'Guest',
        concern: 'Community conduct',
        reports: '2',
        lastEvent: '3d ago',
        status: 'Escalated',
        statusClasses: ['bg-rose-50', 'text-rose-700', 'border-rose-200'],
      },
    ];

    const moderationSection = screen.getByTestId('moderation-tools');
    const table = within(moderationSection).getByRole('table');

    const headers = within(table).getAllByRole('columnheader');
    expect(headers.map((header) => header.textContent?.trim())).toEqual([
      'Member',
      'Role',
      'Concern',
      'Reports',
      'Last activity',
      'Status',
      'Actions',
    ]);

    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(expectedQueue.length);

    rows.forEach((row, index) => {
      const entry = expectedQueue[index];
      const rowScope = within(row);
      expect(rowScope.getByText(entry.member)).toBeInTheDocument();
      expect(rowScope.getByText(entry.role)).toBeInTheDocument();
      expect(rowScope.getByText(entry.concern)).toBeInTheDocument();
      expect(rowScope.getByText(entry.reports)).toBeInTheDocument();
      expect(rowScope.getByText(entry.lastEvent)).toBeInTheDocument();
      const statusPill = rowScope.getByText(entry.status);
      entry.statusClasses.forEach((className) => {
        expect(statusPill).toHaveClass(className);
      });

      const actionButtons = rowScope.getAllByRole('button');
      expect(actionButtons.map((button) => button.textContent)).toEqual([
        'Notes',
        'Approve',
        'Restrict',
      ]);
    });
  });
});
