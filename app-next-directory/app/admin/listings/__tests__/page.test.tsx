import { render, screen } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

const listingsTableMock = jest.fn();

jest.mock('../ListingsManagementTable', () => ({
  ListingsManagementTable: (props: unknown) => {
    listingsTableMock(props);
    return <div data-testid="listings-management-table" />;
  },
}));

const mockAuth = jest.requireMock('@/lib/auth').auth as jest.Mock;
const mockRedirect = jest.requireMock('next/navigation').redirect as jest.Mock;

describe('Admin listings page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the listings management interface for admins', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' },
    });

    const AdminListingsPage = (await import('../page')).default;
    render(await AdminListingsPage());

    expect(screen.getByTestId('admin-listings-page')).toBeInTheDocument();
    expect(screen.getByTestId('admin-listings-title')).toHaveTextContent('Listing Management');
    expect(screen.getByTestId('listings-management-table')).toBeInTheDocument();
    expect(listingsTableMock).toHaveBeenCalledWith({
      currentUserRole: 'admin',
      currentUserId: 'admin-1',
    });
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('redirects when the viewer is not an admin', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', role: 'user' },
    });
    mockRedirect.mockImplementation(() => {
      throw new Error('redirect');
    });

    const AdminListingsPage = (await import('../page')).default;

    await expect(AdminListingsPage()).rejects.toThrow('redirect');
    expect(mockRedirect).toHaveBeenCalledWith('/auth/login?callbackUrl=/admin/listings');
  });
});
