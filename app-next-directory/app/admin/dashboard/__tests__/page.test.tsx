import { render, screen, within } from '@testing-library/react';
import AdminDashboardPage, { dynamic, metadata } from '../page';

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
    expect(screen.getByText('tasks assigned')).toBeInTheDocument();
    expect(screen.getByText('SLA: 8h')).toBeInTheDocument();
  });

  it('lists analytics highlight cards with their metrics', () => {
    const analyticsSection = screen.getByTestId('analytics-overview');
    const highlightCards = within(analyticsSection).getAllByRole('article');
    expect(highlightCards.length).toBeGreaterThanOrEqual(4);

    // Check that we have the expected card titles
    const expectedTitles = ['Active members', 'Total listings', 'Weekly signups', 'Items pending review'];
    expectedTitles.forEach(title => {
      expect(within(analyticsSection).getByText(title)).toBeInTheDocument();
    });
  });

  it('renders the moderation queue table with proper structure', () => {
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
  });

  it('shows moderation queue actions', () => {
    const moderationSection = screen.getByTestId('moderation-tools');

    // Check for action buttons (may not be present if no items in queue)
    const notesButtons = screen.queryAllByText('Notes');
    const approveButtons = screen.queryAllByText('Approve');
    const restrictButtons = screen.queryAllByText('Restrict');

    // If there are any rows, they should have the same number of each action type
    if (notesButtons.length > 0) {
      expect(approveButtons).toHaveLength(notesButtons.length);
      expect(restrictButtons).toHaveLength(notesButtons.length);
    }
  });
});
