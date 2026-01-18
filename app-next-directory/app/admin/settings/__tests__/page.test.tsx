import { render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import AdminSettingsPage from '../page';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('../data', () => ({
  getAdminSettings: jest.fn(),
}));

jest.mock('../SettingsForm', () => ({
  SettingsForm: jest.fn(() => <div data-testid="settings-form-mock">Settings Form</div>),
}));

describe('AdminSettingsPage', () => {
  const mockAuth = auth as jest.MockedFunction<typeof auth>;
  const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
  const mockGetAdminSettings = jest.requireMock('../data').getAdminSettings as jest.MockedFunction<
    () => Promise<unknown>
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAdminSettings.mockResolvedValue({
      siteName: 'Admin Console',
      siteDescription: 'Configured',
      maintenanceMode: false,
      allowRegistrations: true,
      emailNotifications: true,
      adminEmail: 'admin@example.com',
      autoModeration: false,
      moderationThreshold: 3,
      postsPerPage: 20,
      enableComments: true,
      requireEmailVerification: false,
      sessionTimeout: 60,
      autoBackup: true,
      backupFrequency: 'weekly',
      lastBackupDate: null,
    });
  });

  it('should render the settings page for admin users', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' },
    } as never);
    const page = await AdminSettingsPage();
    const { container } = render(page);

    expect(screen.getByTestId('admin-settings-page')).toBeInTheDocument();
    expect(screen.getByTestId('admin-settings-title')).toHaveTextContent('Admin Settings');
    expect(screen.getByText('Configure application settings and preferences.')).toBeInTheDocument();
    expect(screen.getByTestId('settings-form-mock')).toBeInTheDocument();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('should render the settings page for superAdmin users', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'superadmin-1', role: 'superAdmin' },
    } as never);

    const page = await AdminSettingsPage();
    render(page);

    expect(screen.getByTestId('admin-settings-page')).toBeInTheDocument();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('should redirect non-admin users to login', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', role: 'user' },
    } as never);

    await AdminSettingsPage();

    expect(mockRedirect).toHaveBeenCalledWith('/auth/login?callbackUrl=/admin/settings');
  });

  it('should redirect when user has no role', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1' },
    } as never);

    await AdminSettingsPage();

    expect(mockRedirect).toHaveBeenCalledWith('/auth/login?callbackUrl=/admin/settings');
  });

  it('should redirect when session is null', async () => {
    mockAuth.mockResolvedValue(null);

    await AdminSettingsPage();

    expect(mockRedirect).toHaveBeenCalledWith('/auth/login?callbackUrl=/admin/settings');
  });

  it('should redirect when user is undefined', async () => {
    mockAuth.mockResolvedValue({ user: undefined } as never);

    await AdminSettingsPage();

    expect(mockRedirect).toHaveBeenCalledWith('/auth/login?callbackUrl=/admin/settings');
  });

  it('should apply correct CSS classes', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' },
    } as never);

    const page = await AdminSettingsPage();
    const { container } = render(page);

    const mainElement = screen.getByTestId('admin-settings-page');
    expect(mainElement).toHaveClass('space-y-6');

    const title = screen.getByTestId('admin-settings-title');
    expect(title).toHaveClass('heading-md', 'text-neo-text-primary');
  });
});
