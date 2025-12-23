import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import type React from 'react';

const mockUseSession = jest.fn();
jest.mock('next-auth/react', () => ({
  useSession: (...args: unknown[]) => mockUseSession(...args),
}));

jest.mock('@/components/layout/Header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

jest.mock('@/components/layout/Footer', () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
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

const mockedNormaliseFavorite = jest.fn((entry: any) => {
  if (!entry) return null;
  const slug = entry?.listing?.slug;
  if (typeof slug !== 'string' || slug.trim().length === 0) return null;
  return {
    id: entry?._id ?? slug,
    name: entry?.listing?.name ?? 'Untitled listing',
    slug,
    city: entry?.listing?.city?.name ?? null,
    country: entry?.listing?.city?.country ?? null,
    priceRange: 'moderate' as const,
    ecoFocusTags: [],
    digitalNomadFeatures: [],
    imageUrl: entry?.listing?.primaryImage?.asset?.url ?? '',
    createdAt: entry?.createdAt ?? '',
  };
});

const mockedNormaliseOwnerReviews = jest.fn((response: any) => {
  if (!response?.listings) return [];
  return response.listings
    .filter((listing: any) => typeof listing?.slug === 'string' && listing.slug)
    .map((listing: any) => ({
      slug: listing.slug,
      name: listing.name ?? 'Untitled listing',
      reviews: Array.isArray(listing?.reviews)
        ? listing.reviews
            .filter((review: any) => typeof review?.id === 'string')
            .map((review: any) => ({
              id: review.id,
              rating: Number(review.rating ?? 0),
              comment: review.comment ?? '',
              createdAt: review.createdAt ?? '',
              reviewerName: review.reviewerName ?? '',
              reviewerImage: review.reviewerImage ?? '',
            }))
        : [],
    }));
});

jest.mock('../profile/utils', () => ({
  normaliseFavorite: (entry: any) => mockedNormaliseFavorite(entry),
  normaliseOwnerReviews: (response: any) => mockedNormaliseOwnerReviews(response),
  formatDate: (date: string) => date,
}));

const originalFetch = global.fetch;
const originalAlert = window.alert;

beforeAll(() => {
  window.alert = jest.fn();
});

afterAll(() => {
  window.alert = originalAlert;
});

afterEach(() => {
  mockUseSession.mockReset();
  global.fetch = originalFetch;
});

describe('ProfilePage', () => {
  it('shows loading state while session is loading', async () => {
    mockUseSession.mockReturnValue({ data: null, status: 'loading', update: jest.fn() });
    global.fetch = jest.fn();

    const { default: ProfilePage } = await import('../profile/page');

    render(<ProfilePage />);

    expect(screen.getByText('Loading your profile…')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('prompts unauthenticated users to sign in', async () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated', update: jest.fn() });
    global.fetch = jest.fn();

    const { default: ProfilePage } = await import('../profile/page');

    render(<ProfilePage />);

    expect(screen.getByText('Sign in to view your profile')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to sign in' })).toHaveAttribute(
      'href',
      '/auth/login'
    );
  });

  it('loads owner review summaries for venue owners', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'owner-1',
          name: 'Taylor',
          role: 'venueOwner',
          email: 'taylor@example.com',
        },
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    const fetchMock = jest.fn(async input => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/api/user/reviews')) {
        return {
          ok: true,
          json: async () => ({
            listings: [
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
            ],
          }),
        } as Response;
      }
      if (url.includes('/api/user/dashboard')) {
        return {
          ok: true,
          json: async () => ({
            dashboard: {
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
            },
          }),
        } as Response;
      }
      return {
        ok: true,
        json: async () => ({}),
      } as Response;
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    const { default: ProfilePage } = await import('../profile/page');

    render(<ProfilePage />);

    const listingsTab = await screen.findByRole('button', { name: /listings/i });
    fireEvent.click(listingsTab);

    await screen.findByText('Reviews for your venues');
    await screen.findByText('Eco Stay');
    await screen.findByText('Wonderful stay');
  });
});
