import { render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';
import AdminLayout from '@/app/admin/layout';
import { auth } from '@/lib/auth';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('AdminLayout', () => {
  const mockAuth = auth as jest.Mock;
  const mockRedirect = redirect as jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should redirect to login if session is null', async () => {
    mockAuth.mockResolvedValue(null);
    await AdminLayout({ children: <div>Child Content</div> });
    expect(mockRedirect).toHaveBeenCalledWith('/auth/login');
  });

  it('should redirect to login if user is not an admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: '1', role: 'user' } });
    await AdminLayout({ children: <div>Child Content</div> });
    expect(mockRedirect).toHaveBeenCalledWith('/auth/login');
  });

  it('should render layout for admin user', async () => {
    mockAuth.mockResolvedValue({ user: { id: '1', role: 'admin' } });
    const result = await AdminLayout({ children: <div>Child Content</div> });
    render(result);

    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Back to Site')).toBeInTheDocument();
    expect(screen.getByText('🔧 Admin')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('should render layout for superAdmin user', async () => {
    mockAuth.mockResolvedValue({ user: { id: '1', role: 'superAdmin' } });
    const result = await AdminLayout({ children: <div>Child Content</div> });
    render(result);

    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    expect(screen.getByText('👑 Super Admin')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('should handle session user being undefined', async () => {
    mockAuth.mockResolvedValue({});
    await AdminLayout({ children: <div>Child Content</div> });
    expect(mockRedirect).toHaveBeenCalledWith('/auth/login');
  });
});
