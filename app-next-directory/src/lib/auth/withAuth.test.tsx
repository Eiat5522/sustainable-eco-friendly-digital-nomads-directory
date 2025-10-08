import { jest } from '@jest/globals';
import { render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';

// Mock next-auth/react
const mockUseSession = jest.fn();
const mockUseRouter = jest.fn();
const mockPush = jest.fn();

jest.mock('next-auth/react', () => ({
  useSession: mockUseSession,
}));

jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: () => mockUseRouter(),
}));

// Mock auth types
jest.mock('../../types/auth', () => ({
  __esModule: true,
  hasPagePermission: jest.fn(() => true),
}));

import { withAuth, withAdminAuth, withUserAuth } from './withAuth';

describe('withAuth HOC', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

      const TestComponent = ({ message }: { message: string }) => (
        <div>{message}</div>
      );
      const WrappedComponent = withAuth(TestComponent);

      render(<WrappedComponent message="Hello World" />);
      
      await waitFor(() => {
        expect(screen.getByText('Hello World')).toBeInTheDocument();
      });
    });

    it('shows loading state while checking authentication', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      });

      const TestComponent = () => <div>Content</div>;
      const WrappedComponent = withAuth(TestComponent);

      render(<WrappedComponent />);
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
  const spinnerElement = document.querySelector('.animate-spin');
  expect(spinnerElement).toBeInTheDocument();
    });

    it('redirects to login when not authenticated', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      const TestComponent = () => <div>Content</div>;
      const WrappedComponent = withAuth(TestComponent);

      await act(async () => {
        render(<WrappedComponent />);
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      }, { timeout: 3000 });
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });

    it('uses custom redirect path', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      const TestComponent = () => <div>Content</div>;
      const WrappedComponent = withAuth(TestComponent, { redirectTo: '/custom-login' });

      await act(async () => {
        render(<WrappedComponent />);
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/custom-login');
      }, { timeout: 3000 });
    });

    it('does not redirect when requireAuth is false', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      const TestComponent = () => <div>Public Content</div>;
      const WrappedComponent = withAuth(TestComponent, { requireAuth: false });

      render(<WrappedComponent />);
      expect(screen.getByText('Public Content')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
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

      await act(async () => {
        render(<WrappedComponent />);
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/unauthorized');
      }, { timeout: 3000 });
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });

    it('handles user without role as unidentifiedUser', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { name: 'User' } },
        status: 'authenticated',
      });

      const TestComponent = () => <div>Admin Content</div>;
      const WrappedComponent = withAuth(TestComponent, { requiredRole: 'admin' });

      await act(async () => {
        render(<WrappedComponent />);
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/unauthorized');
      }, { timeout: 3000 });
    });
  });

  describe('component display name', () => {
    it('sets display name with component name', () => {
      const TestComponent = () => <div>Test</div>;
      TestComponent.displayName = 'TestComponent';
      
      const WrappedComponent = withAuth(TestComponent);
      expect(WrappedComponent.displayName).toBe('withAuth(TestComponent)');
    });

    it('sets display name with function name when displayName is not set', () => {
      function NamedComponent() {
        return <div>Test</div>;
      }
      
      const WrappedComponent = withAuth(NamedComponent);
      expect(WrappedComponent.displayName).toBe('withAuth(NamedComponent)');
    });

    it('handles anonymous components', () => {
      const WrappedComponent = withAuth(() => <div>Test</div>);
      expect(WrappedComponent.displayName).toContain('withAuth');
    });
  });

  describe('loading state transitions', () => {
    it('does not redirect during loading state', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      });

      const TestComponent = () => <div>Content</div>;
      const WrappedComponent = withAuth(TestComponent);

      render(<WrappedComponent />);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('waits for loading to complete before redirecting', async () => {
      // Start with loading
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      });

      const TestComponent = () => <div>Content</div>;
      const WrappedComponent = withAuth(TestComponent);

      const { rerender } = render(<WrappedComponent />);
      expect(mockPush).not.toHaveBeenCalled();

      // Change to unauthenticated
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      await act(async () => {
        rerender(<WrappedComponent />);
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      }, { timeout: 3000 });
    });
  });
});

describe('withAdminAuth HOC', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
    });
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

    await act(async () => {
      render(<WrappedComponent />);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/unauthorized');
    }, { timeout: 3000 });
  });
});

describe('withUserAuth HOC', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
    });
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

    await act(async () => {
      render(<WrappedComponent />);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    }, { timeout: 3000 });
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
