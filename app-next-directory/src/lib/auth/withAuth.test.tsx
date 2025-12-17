import { jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Import the HOCs to be tested
import { withAdminAuth, withAuth, withUserAuth } from './withAuth';

// The modules 'next-auth/react' and 'next/navigation' are globally mocked by Jest.
// We can import them and cast to mocks to control their behavior in tests.
const mockUseSession = useSession as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;
const mockPush = jest.fn();

describe('withAuth HOC', () => {
  beforeEach(() => {
    // Clear all mock history and implementations before each test
    jest.clearAllMocks();

    // Provide a fresh mock for useRouter for each test
    mockUseRouter.mockReturnValue({
      push: mockPush,
    });
  });

  describe('basic authentication', () => {
    it('renders component when user is authenticated', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: 'Test User', role: 'user' } },
        status: 'authenticated',
      });

      const TestComponent = ({ message }: { message: string }) => <div>{message}</div>;
      const WrappedComponent = withAuth(TestComponent);

      render(<WrappedComponent message="Hello World" />);

      await waitFor(() => {
        expect(screen.getByText('Hello World')).toBeInTheDocument();
      });
    });

    it('shows loading state while checking authentication', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      });

      const TestComponent = () => <div>Content</div>;
      const WrappedComponent = withAuth(TestComponent);

      render(<WrappedComponent />);
      await waitFor(() => {
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
        const spinnerElement = document.querySelector('.animate-spin');
        expect(spinnerElement).toBeInTheDocument();
      });
    });

    it('redirects to login when not authenticated', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      const TestComponent = () => <div>Content</div>;
      const WrappedComponent = withAuth(TestComponent);

      render(<WrappedComponent />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });

    it('uses custom redirect path', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      const TestComponent = () => <div>Content</div>;
      const WrappedComponent = withAuth(TestComponent, { redirectTo: '/custom-login' });

      render(<WrappedComponent />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/custom-login');
      });
    });
  });

  describe('role-based authentication', () => {
    it('renders component when user has required role', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: 'Admin User', role: 'admin' } },
        status: 'authenticated',
      });

      const TestComponent = () => <div>Admin Content</div>;
      const WrappedComponent = withAuth(TestComponent, { requiredRole: 'admin' });

      render(<WrappedComponent />);

      await waitFor(() => {
        expect(screen.getByText('Admin Content')).toBeInTheDocument();
      });
    });

    it('redirects to unauthorized when user lacks required role', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: 'Regular User', role: 'user' } },
        status: 'authenticated',
      });

      const TestComponent = () => <div>Admin Content</div>;
      const WrappedComponent = withAuth(TestComponent, { requiredRole: 'admin' });

      render(<WrappedComponent />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/unauthorized');
      });
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });

    it('handles user without role as unidentifiedUser and redirects', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: 'User' } }, // No role property
        status: 'authenticated',
      });

      const TestComponent = () => <div>Admin Content</div>;
      const WrappedComponent = withAuth(TestComponent, { requiredRole: 'admin' });

      render(<WrappedComponent />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/unauthorized');
      });
    });
  });

  describe('loading state transitions', () => {
    it('waits for loading to complete before redirecting', async () => {
      mockUseSession.mockReturnValue({ data: null, status: 'loading' });

      const TestComponent = () => <div>Content</div>;
      const WrappedComponent = withAuth(TestComponent);

      const { rerender } = render(<WrappedComponent />);
      expect(mockPush).not.toHaveBeenCalled();

      // Transition from loading to unauthenticated
      mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
      rerender(<WrappedComponent />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });
    });
  });
});

describe('withAdminAuth HOC', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush });
  });

  it('renders component for admin users', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: 'Admin', role: 'admin' } },
      status: 'authenticated',
    });

    const TestComponent = () => <div>Admin Panel</div>;
    const WrappedComponent = withAdminAuth(TestComponent);

    render(<WrappedComponent />);

    await waitFor(() => {
      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    });
  });

  it('redirects non-admin users', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: 'User', role: 'user' } },
      status: 'authenticated',
    });

    const TestComponent = () => <div>Admin Panel</div>;
    const WrappedComponent = withAdminAuth(TestComponent);

    render(<WrappedComponent />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/unauthorized');
    });
  });
});

describe('withUserAuth HOC', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush });
  });

  it('renders component for authenticated users', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: 'User', role: 'user' } },
      status: 'authenticated',
    });

    const TestComponent = () => <div>User Content</div>;
    const WrappedComponent = withUserAuth(TestComponent);

    render(<WrappedComponent />);

    await waitFor(() => {
      expect(screen.getByText('User Content')).toBeInTheDocument();
    });
  });

  it('redirects unauthenticated users', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    const TestComponent = () => <div>User Content</div>;
    const WrappedComponent = withUserAuth(TestComponent);

    render(<WrappedComponent />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('accepts any authenticated user regardless of role', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: 'Admin', role: 'admin' } },
      status: 'authenticated',
    });

    const TestComponent = () => <div>User Content</div>;
    const WrappedComponent = withUserAuth(TestComponent);

    render(<WrappedComponent />);

    await waitFor(() => {
      expect(screen.getByText('User Content')).toBeInTheDocument();
    });
  });
});
