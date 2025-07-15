import { renderHook, act } from '@testing-library/react';
import { useSession } from '@auth/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { useRequireAuth, useIsAuthorized, useRedirectIfAuthenticated } from './useAuth';
import { UserRole } from '@/types/auth';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

describe('useRequireAuth', () => {
  const mockPush = jest.fn();
  const mockUseRouter = useRouter as jest.Mock;
  const mockUsePathname = usePathname as jest.Mock;
  const mockUseSession = useSession as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush });
    mockUsePathname.mockReturnValue('/current-path');
  });

  test('does nothing while loading', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'loading' });
    renderHook(() => useRequireAuth());
    expect(mockPush).not.toHaveBeenCalled();
  });

  test('redirects to signin when not authenticated', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    renderHook(() => useRequireAuth());
    expect(mockPush).toHaveBeenCalledWith('/auth/signin?callbackUrl=%2Fcurrent-path');
  });

  test('redirects to unauthorized when role does not match', () => {
    mockUseSession.mockReturnValue({
      data: { user: { role: 'user' } },
      status: 'authenticated',
    });
    renderHook(() => useRequireAuth(['admin']));
    expect(mockPush).toHaveBeenCalledWith('/auth/unauthorized');
  });

  test('does not redirect when authenticated and role matches', () => {
    mockUseSession.mockReturnValue({
      data: { user: { role: 'admin' } },
      status: 'authenticated',
    });
    renderHook(() => useRequireAuth(['admin']));
    expect(mockPush).not.toHaveBeenCalled();
  });

  test('does not redirect when authenticated and no roles required', () => {
    mockUseSession.mockReturnValue({
      data: { user: { role: 'user' } },
      status: 'authenticated',
    });
    renderHook(() => useRequireAuth());
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe('useIsAuthorized', () => {
  const mockUseSession = useSession as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns false when not authenticated', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    const { result } = renderHook(() => useIsAuthorized());
    expect(result.current).toBe(false);
  });

  test('returns true when authenticated and no roles required', () => {
    mockUseSession.mockReturnValue({
      data: { user: { role: 'user' } },
      status: 'authenticated',
    });
    const { result } = renderHook(() => useIsAuthorized());
    expect(result.current).toBe(true);
  });

  test('returns true when role matches required roles', () => {
    mockUseSession.mockReturnValue({
      data: { user: { role: 'admin' } },
      status: 'authenticated',
    });
    const { result } = renderHook(() => useIsAuthorized(['admin']));
    expect(result.current).toBe(true);
  });

  test('returns false when role does not match required roles', () => {
    mockUseSession.mockReturnValue({
      data: { user: { role: 'user' } },
      status: 'authenticated',
    });
    const { result } = renderHook(() => useIsAuthorized(['admin']));
    expect(result.current).toBe(false);
  });
});

describe('useRedirectIfAuthenticated', () => {
  const mockPush = jest.fn();
  const mockUseRouter = useRouter as jest.Mock;
  const mockUseSession = useSession as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush });
  });

  test('does nothing while loading', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'loading' });
    renderHook(() => useRedirectIfAuthenticated('/redirect-to'));
    expect(mockPush).not.toHaveBeenCalled();
  });

  test('redirects when authenticated', () => {
    mockUseSession.mockReturnValue({
      data: { user: { role: 'user' } },
      status: 'authenticated',
    });
    renderHook(() => useRedirectIfAuthenticated('/redirect-to'));
    expect(mockPush).toHaveBeenCalledWith('/redirect-to');
  });

  // Skip this test if document is not defined (Node.js environment)
  (typeof document === 'undefined' ? test.skip : test)(
    'does not redirect when not authenticated',
    () => {
      mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
      renderHook(() => useRedirectIfAuthenticated('/redirect-to'));
      expect(mockPush).not.toHaveBeenCalled();
    }
  );
});
