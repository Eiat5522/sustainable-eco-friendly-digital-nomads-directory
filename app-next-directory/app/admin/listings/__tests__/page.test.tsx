import { render, screen } from '@testing-library/react';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
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

describe('Admin listings page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the listings management interface for admins', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'admin-1', role: 'admin' },
    });

    const AdminListingsPage = (await import('../page')).default;
    const element = await AdminListingsPage();
    render(element);

    expect(screen.getByTestId('admin-listings-page')).toBeInTheDocument();
    expect(screen.getByTestId('admin-listings-title')).toHaveTextContent('Listing Management');
    expect(screen.getByTestId('listings-management-table')).toBeInTheDocument();
    expect(listingsTableMock).toHaveBeenCalledWith({
      currentUserRole: 'admin',
      currentUserId: 'admin-1',
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
});
