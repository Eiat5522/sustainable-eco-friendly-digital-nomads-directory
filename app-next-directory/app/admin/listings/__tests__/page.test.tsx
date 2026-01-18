import { render, screen } from '@testing-library/react';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('../data', () => ({
  getAdminListings: jest.fn(),
  getAdminListingStats: jest.fn(),
}));

const redirectMock = jest.fn();

jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

const listingsTableMock = jest.fn();

jest.mock('../ListingsManagementTable', () => ({
  ListingsManagementTable: (props: unknown) => {
    listingsTableMock(props);
    return <div data-testid="listings-management-table" />;
  },
}));

const mockAuth = jest.requireMock('@/lib/auth').auth as jest.MockedFunction<
  () => Promise<{ user?: unknown } | null>
>;
const mockGetAdminListings = jest.requireMock('../data').getAdminListings as jest.MockedFunction<
  () => Promise<unknown>
>;
const mockGetAdminListingStats = jest.requireMock('../data')
  .getAdminListingStats as jest.MockedFunction<() => Promise<unknown>>;

describe('Admin listings page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the listings management interface for admins', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'admin-1', role: 'admin' },
    });
    mockGetAdminListings.mockResolvedValueOnce({
      listings: [],
      pagination: {
        page: 1,
        limit: 20,
        totalCount: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
      filters: {
        search: '',
        status: null,
        type: null,
      },
    });
    mockGetAdminListingStats.mockResolvedValueOnce({
      totalListings: 0,
      publishedListings: 0,
      unpublishedListings: 0,
      pendingListings: 0,
      draftListings: 0,
      featuredListings: 0,
      listingsByType: {},
    });

    const AdminListingsPage = (await import('../page')).default;
    const element = await AdminListingsPage();
    render(element);

    expect(screen.getByTestId('admin-listings-page')).toBeInTheDocument();
    expect(screen.getByTestId('admin-listings-title')).toHaveTextContent('Listing Management');
    expect(screen.getByTestId('listings-management-table')).toBeInTheDocument();
    expect(listingsTableMock).toHaveBeenCalledWith({
      initialData: {
        listings: [],
        pagination: {
          page: 1,
          limit: 20,
          totalCount: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
        filters: {
          search: '',
          status: null,
          type: null,
        },
      },
      initialStats: {
        totalListings: 0,
        publishedListings: 0,
        unpublishedListings: 0,
        pendingListings: 0,
        draftListings: 0,
        featuredListings: 0,
        listingsByType: {},
      },
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('redirects when the viewer is not an admin', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'user-1', role: 'user' },
    });
    redirectMock.mockImplementation(() => {
      throw new Error('redirect');
    });

    const AdminListingsPage = (await import('../page')).default;

    await expect(AdminListingsPage()).rejects.toThrow('redirect');
    expect(redirectMock).toHaveBeenCalledWith('/auth/login?callbackUrl=/admin/listings');
  });

  it('handles data fetch errors gracefully', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'admin-1', role: 'admin' },
    });
    mockGetAdminListings.mockRejectedValueOnce(new Error('Network error'));
    mockGetAdminListingStats.mockRejectedValueOnce(new Error('Network error'));

    const AdminListingsPage = (await import('../page')).default;
    const element = await AdminListingsPage();
    render(element);

    expect(screen.getByTestId('admin-listings-page')).toBeInTheDocument();
    expect(listingsTableMock).toHaveBeenCalledWith({
      initialData: undefined,
      initialStats: undefined,
    });
  });
});
