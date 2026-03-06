import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import type React from 'react';

const mockAuth = jest.fn();
jest.mock('@/lib/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

const mockGetDashboard = jest.fn();
const mockGetOwnerReviews = jest.fn();
jest.mock('@/lib/data-access/profile.dal', () => ({
  getUserDashboardForProfile: (...args: unknown[]) => mockGetDashboard(...args),
  getOwnerReviewsForProfile: (...args: unknown[]) => mockGetOwnerReviews(...args),
}));

jest.mock('@/components/layout/HeaderServer', () => ({
  HeaderServer: () => <div data-testid="header">Header</div>,
}));

jest.mock('@/components/layout/FooterServer', () => ({
  FooterServer: () => <div data-testid="footer">Footer</div>,
}));

jest.mock('lucide-react', () => ({
  Heart: (props: React.SVGAttributes<SVGElement>) => <svg data-testid="icon-heart" {...props} />,
  Loader2: (props: React.SVGAttributes<SVGElement>) => <svg data-testid="icon-loader" {...props} />,
  MessageSquare: (props: React.SVGAttributes<SVGElement>) => (
    <svg data-testid="icon-message" {...props} />
  ),
  Star: (props: React.SVGAttributes<SVGElement>) => <svg data-testid="icon-star" {...props} />,
  Edit: (props: React.SVGAttributes<SVGElement>) => <svg data-testid="icon-edit" {...props} />,
}));

jest.mock('@/components/ui/neo-card', () => ({
  NeoCard: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="neo-card">{children}</div>
  ),
  NeoCardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  NeoCardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  NeoCardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  NeoCardDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/neo-badge', () => ({
  NeoBadge: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="neo-badge">{children}</span>
  ),
}));

jest.mock('@/components/ui/neo-button', () => ({
  NeoButton: ({
    children,
    asChild = false,
    ...rest
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) =>
    asChild ? (
      children
    ) : (
      <button type="button" data-testid="neo-button" {...rest}>
        {children}
      </button>
    ),
}));

jest.mock('@/components/profile/ProfileEditForm', () => ({
  ProfileEditForm: ({ onSuccess }: { currentName: string; onSuccess: () => void }) => (
    <div data-testid="profile-edit-form">
      <button type="button" onClick={onSuccess}>
        Save
      </button>
    </div>
  ),
}));

afterEach(() => {
  mockAuth.mockReset();
  mockGetDashboard.mockReset();
  mockGetOwnerReviews.mockReset();
});

describe('ProfilePage', () => {
  it('prompts unauthenticated users to sign in', async () => {
    mockAuth.mockResolvedValue(null);
    mockGetDashboard.mockResolvedValue(null);
    mockGetOwnerReviews.mockResolvedValue([]);

    const { ProfileContent } = await import('../profile/page');

    const page = await ProfileContent();
    render(page);

    expect(await screen.findByText('Sign in to view your profile')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to sign in' })).toHaveAttribute(
      'href',
      '/auth/login'
    );
  });

  it('loads owner review summaries for venue owners', async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: 'owner-1',
        name: 'Taylor',
        role: 'venueOwner',
        email: 'taylor@example.com',
      },
    });

    mockGetDashboard.mockResolvedValue({
      generatedAt: '2024-03-01T00:00:00.000Z',
      range: { months: 3 },
      data: {
        kind: 'venueOwner',
        totals: {
          avgRating: 4.5,
          favoritesCount: 10,
          reviewCount: 3,
          viewCount: 120,
        },
        listings: [],
        monthlyTotals: [],
        notices: [],
      },
    });

    mockGetOwnerReviews.mockResolvedValue([
      {
        slug: 'eco-stay',
        name: 'Eco Stay',
        reviews: [
          {
            id: 'rev-1',
            rating: 5,
            comment: 'Wonderful stay',
            createdAt: '2024-02-02T00:00:00.000Z',
            reviewerName: 'Jordan',
          },
        ],
      },
    ]);

    const { ProfileContent } = await import('../profile/page');

    const page = await ProfileContent();
    render(page);

    const listingsTab = await screen.findByRole('button', { name: /listings/i });
    fireEvent.click(listingsTab);

    await screen.findByText('Reviews for your venues');
    await screen.findByText('Eco Stay');
    await screen.findByText('Wonderful stay');
  });
});
