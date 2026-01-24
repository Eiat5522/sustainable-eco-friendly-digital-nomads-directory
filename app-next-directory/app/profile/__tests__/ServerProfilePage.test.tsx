/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { UserDashboardPayloadDTO } from '@/types/dto';

// Mock Next.js components
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Mock components
jest.mock('@/components/layout/Footer', () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

jest.mock('@/components/layout/Header', () => ({
  Header: () => <header data-testid="header">Header</header>,
}));

// Mock dashboard data function
jest.mock('@/lib/dashboard/user-dashboard', () => ({
  getUserDashboardData: jest.fn(),
}));

const mockGetUserDashboardData = jest.requireMock('@/lib/dashboard/user-dashboard')
  .getUserDashboardData as jest.MockedFunction<
  typeof import('@/lib/dashboard/user-dashboard').getUserDashboardData
>;
const mockRedirect = jest.requireMock('next/navigation').redirect as jest.MockedFunction<
  typeof import('next/navigation').redirect
>;

describe('ServerProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockVenueOwnerDashboard: UserDashboardPayloadDTO = {
    user: {
      id: 'user-123',
      role: 'venueOwner',
      name: 'John Venue',
      email: 'john@example.com',
    },
    generatedAt: '2024-01-01T00:00:00Z',
    range: {
      months: 6,
      from: '2023-07-01',
      to: '2024-01-01',
    },
    data: {
      kind: 'venueOwner',
      listings: [],
      totals: {
        avgRating: 4.5,
        reviewCount: 10,
        favoritesCount: 5,
        viewCount: 100,
      },
      monthlyTotals: [],
      notices: [],
    },
  };

  const mockRegularUserDashboard: UserDashboardPayloadDTO = {
    user: {
      id: 'user-456',
      role: 'user',
      name: 'Jane User',
      email: 'jane@example.com',
    },
    generatedAt: '2024-01-01T00:00:00Z',
    range: {
      months: 6,
      from: '2023-07-01',
      to: '2024-01-01',
    },
    data: {
      kind: 'user',
      favorites: [],
      metrics: {
        favoritesCount: 3,
        reviewsWritten: 7,
        avgRatingGiven: 4.2,
      },
      monthly: [],
    },
  };

  describe('authentication', () => {
    it('should redirect to login when userId is not provided', async () => {
      const ServerProfilePage = (await import('../ServerProfilePage')).default;

      await ServerProfilePage({
        userId: '',
        userRole: 'user',
        userName: 'Test User',
      });

      expect(mockRedirect).toHaveBeenCalledWith('/auth/login');
    });
  });

  describe('venue owner profile', () => {
    it('should render venue owner profile with correct stats', async () => {
      mockGetUserDashboardData.mockResolvedValue(mockVenueOwnerDashboard);

      const ServerProfilePage = (await import('../ServerProfilePage')).default;
      const component = await ServerProfilePage({
        userId: 'user-123',
        userRole: 'venueOwner',
        userName: 'John Venue',
        userEmail: 'john@example.com',
      });

      render(component);

      expect(screen.getByText('John Venue')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('venueOwner')).toBeInTheDocument();
    });

    it('should display venue owner statistics', async () => {
      mockGetUserDashboardData.mockResolvedValue(mockVenueOwnerDashboard);

      const ServerProfilePage = (await import('../ServerProfilePage')).default;
      const component = await ServerProfilePage({
        userId: 'user-123',
        userRole: 'venueOwner',
        userName: 'John Venue',
        userEmail: 'john@example.com',
      });

      render(component);

      expect(screen.getByText('Total Reviews')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('Average Rating')).toBeInTheDocument();
      expect(screen.getByText('4.5')).toBeInTheDocument();
      expect(screen.getByText('Active Listings')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should render user image when provided', async () => {
      mockGetUserDashboardData.mockResolvedValue(mockVenueOwnerDashboard);

      const ServerProfilePage = (await import('../ServerProfilePage')).default;
      const component = await ServerProfilePage({
        userId: 'user-123',
        userRole: 'venueOwner',
        userName: 'John Venue',
        userEmail: 'john@example.com',
        userImage: 'https://example.com/avatar.jpg',
      });

      render(component);

      const image = screen.getByAltText('John Venue');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src');
    });

    it('should not render image when not provided', async () => {
      mockGetUserDashboardData.mockResolvedValue(mockVenueOwnerDashboard);

      const ServerProfilePage = (await import('../ServerProfilePage')).default;
      const component = await ServerProfilePage({
        userId: 'user-123',
        userRole: 'venueOwner',
        userName: 'John Venue',
        userEmail: 'john@example.com',
      });

      render(component);

      const image = screen.queryByAltText('John Venue');
      expect(image).not.toBeInTheDocument();
    });

    it('should display formatted generated at timestamp', async () => {
      mockGetUserDashboardData.mockResolvedValue(mockVenueOwnerDashboard);

      const ServerProfilePage = (await import('../ServerProfilePage')).default;
      const component = await ServerProfilePage({
        userId: 'user-123',
        userRole: 'venueOwner',
        userName: 'John Venue',
        userEmail: 'john@example.com',
      });

      render(component);

      expect(screen.getByText(/Generated at:/)).toBeInTheDocument();
    });
  });

  describe('regular user profile', () => {
    it('should render regular user profile with correct stats', async () => {
      mockGetUserDashboardData.mockResolvedValue(mockRegularUserDashboard);

      const ServerProfilePage = (await import('../ServerProfilePage')).default;
      const component = await ServerProfilePage({
        userId: 'user-456',
        userRole: 'user',
        userName: 'Jane User',
        userEmail: 'jane@example.com',
      });

      render(component);

      expect(screen.getByText('Jane User')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('user')).toBeInTheDocument();
    });

    it('should display regular user statistics', async () => {
      mockGetUserDashboardData.mockResolvedValue(mockRegularUserDashboard);

      const ServerProfilePage = (await import('../ServerProfilePage')).default;
      const component = await ServerProfilePage({
        userId: 'user-456',
        userRole: 'user',
        userName: 'Jane User',
        userEmail: 'jane@example.com',
      });

      render(component);

      expect(screen.getByText('Total Reviews')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('Average Rating')).toBeInTheDocument();
      expect(screen.getByText('4.2')).toBeInTheDocument();
      expect(screen.getByText('Active Listings')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should show zero active listings for regular user', async () => {
      mockGetUserDashboardData.mockResolvedValue(mockRegularUserDashboard);

      const ServerProfilePage = (await import('../ServerProfilePage')).default;
      const component = await ServerProfilePage({
        userId: 'user-456',
        userRole: 'user',
        userName: 'Jane User',
      });

      render(component);

      const activeListingsText = screen
        .getAllByText('0')
        .find(el => el.parentElement?.textContent?.includes('Active Listings'));
      expect(activeListingsText).toBeInTheDocument();
    });
  });

  describe('null dashboard handling', () => {
    it('should handle null dashboard gracefully', async () => {
      mockGetUserDashboardData.mockResolvedValue(null);

      const ServerProfilePage = (await import('../ServerProfilePage')).default;
      const component = await ServerProfilePage({
        userId: 'user-789',
        userRole: 'user',
        userName: 'Test User',
        userEmail: 'test@example.com',
      });

      render(component);

      expect(screen.getAllByText('0').length).toBeGreaterThan(0);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('should show em dash for null average rating', async () => {
      mockGetUserDashboardData.mockResolvedValue({
        ...mockVenueOwnerDashboard,
        data: {
          ...mockVenueOwnerDashboard.data,
          totals: {
            avgRating: null,
            reviewCount: 0,
            favoritesCount: 0,
            viewCount: 0,
          },
        },
      });

      const ServerProfilePage = (await import('../ServerProfilePage')).default;
      const component = await ServerProfilePage({
        userId: 'user-123',
        userRole: 'venueOwner',
        userName: 'John Venue',
        userEmail: 'john@example.com',
      });

      render(component);

      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('layout components', () => {
    it('should render Header component', async () => {
      mockGetUserDashboardData.mockResolvedValue(mockVenueOwnerDashboard);

      const ServerProfilePage = (await import('../ServerProfilePage')).default;
      const component = await ServerProfilePage({
        userId: 'user-123',
        userRole: 'venueOwner',
        userName: 'John Venue',
      });

      render(component);

      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('should render Footer component', async () => {
      mockGetUserDashboardData.mockResolvedValue(mockVenueOwnerDashboard);

      const ServerProfilePage = (await import('../ServerProfilePage')).default;
      const component = await ServerProfilePage({
        userId: 'user-123',
        userRole: 'venueOwner',
        userName: 'John Venue',
      });

      render(component);

      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('CSS classes', () => {
    it('should apply correct container classes', async () => {
      mockGetUserDashboardData.mockResolvedValue(mockVenueOwnerDashboard);

      const ServerProfilePage = (await import('../ServerProfilePage')).default;
      const component = await ServerProfilePage({
        userId: 'user-123',
        userRole: 'venueOwner',
        userName: 'John Venue',
      });

      const { container } = render(component);

      const main = container.querySelector('main');
      expect(main).toHaveClass('container');
      expect(main).toBeInTheDocument();
    });

    it('should render role badge with correct styling', async () => {
      mockGetUserDashboardData.mockResolvedValue(mockVenueOwnerDashboard);

      const ServerProfilePage = (await import('../ServerProfilePage')).default;
      const component = await ServerProfilePage({
        userId: 'user-123',
        userRole: 'venueOwner',
        userName: 'John Venue',
      });

      render(component);

      const roleBadge = screen.getByText('venueOwner');
      expect(roleBadge).toHaveClass('inline-block');
      expect(roleBadge).toBeInTheDocument();
    });
  });

  describe('getUserDashboardData calls', () => {
    it('should call getUserDashboardData with correct parameters', async () => {
      mockGetUserDashboardData.mockResolvedValue(mockVenueOwnerDashboard);

      const ServerProfilePage = (await import('../ServerProfilePage')).default;
      await ServerProfilePage({
        userId: 'user-123',
        userRole: 'venueOwner',
        userName: 'John Venue',
        userEmail: 'john@example.com',
      });

      expect(mockGetUserDashboardData).toHaveBeenCalledWith({
        id: 'user-123',
        role: 'venueOwner',
        name: 'John Venue',
        email: 'john@example.com',
      });
    });

    it('should call getUserDashboardData without email when not provided', async () => {
      mockGetUserDashboardData.mockResolvedValue(mockVenueOwnerDashboard);

      const ServerProfilePage = (await import('../ServerProfilePage')).default;
      await ServerProfilePage({
        userId: 'user-123',
        userRole: 'venueOwner',
        userName: 'John Venue',
      });

      expect(mockGetUserDashboardData).toHaveBeenCalledWith({
        id: 'user-123',
        role: 'venueOwner',
        name: 'John Venue',
        email: undefined,
      });
    });
  });
});
