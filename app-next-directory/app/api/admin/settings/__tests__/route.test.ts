import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  auth: jest.fn(),
}));

jest.mock('@/lib/sanity/client', () => {
  const fetchMock = jest.fn();
  const createMock = jest.fn();
  const commitMock = jest.fn();
  const setMock = jest.fn().mockImplementation(() => ({ commit: commitMock }));
  const patchMock = jest.fn().mockImplementation(() => ({ set: setMock }));

  const mockClientInstance = {
    fetch: fetchMock,
    create: createMock,
    patch: patchMock,
  };

  return {
    __esModule: true,
    client: jest.fn(() => mockClientInstance), // Mock `client` as a function returning the mocked instance
    __mock: {
      fetchMock,
      createMock,
      patchMock,
      setMock,
      commitMock,
      mockClientInstance, // Export the mock client instance
    },
  };
});

const authMockModule = jest.requireMock('@/lib/auth') as { auth: jest.Mock };
const clientMockModule = jest.requireMock('@/lib/sanity/client') as {
  client: jest.Mock<() => { fetch: jest.Mock; create: jest.Mock; patch: jest.Mock }>;
  __mock: {
    fetchMock: jest.Mock;
    createMock: jest.Mock;
    patchMock: jest.Mock;
    setMock: jest.Mock;
    commitMock: jest.Mock;
    mockClientInstance: { fetch: jest.Mock; create: jest.Mock; patch: jest.Mock };
  };
};

type RouteModule = typeof import('../route');
let GET: RouteModule['GET'];
let POST: RouteModule['POST'];

type BackupRouteModule = typeof import('../backup/route');
let BACKUP_POST: BackupRouteModule['POST'];

const mockAuth = authMockModule.auth;
const mockFetch = clientMockModule.__mock.mockClientInstance.fetch; // Reference the fetch mock from the instance
const mockCreate = clientMockModule.__mock.mockClientInstance.create; // Reference the create mock from the instance
const mockPatch = clientMockModule.__mock.mockClientInstance.patch; // Reference the patch mock from the instance
const mockSet = clientMockModule.__mock.setMock;
const mockCommit = clientMockModule.__mock.commitMock;

beforeAll(async () => {
  ({ GET, POST } = await import('../route'));
  ({ POST: BACKUP_POST } = await import('../backup/route'));
});

describe('/api/admin/settings', () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockFetch.mockReset();
    mockCreate.mockReset();
    mockPatch.mockReset();
    mockSet.mockReset();
    mockCommit.mockReset();
    mockSet.mockImplementation(() => ({ commit: mockCommit }));
    mockPatch.mockImplementation(() => ({ set: mockSet }));
  });

  describe('GET', () => {
    it('requires admin access', async () => {
      mockAuth.mockResolvedValue({ user: { role: 'user' } } as any);

      const request = { url: 'https://example.com/api/admin/settings' } as any;
      const response = await GET(request, { params: Promise.resolve({}) });
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error).toBe('Admin access required');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns existing settings when they exist', async () => {
      mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);

      const mockSettings = {
        _id: 'settings-1',
        _type: 'adminSettings',
        siteName: 'Test Site',
        siteDescription: 'Test Description',
        maintenanceMode: false,
        allowRegistrations: true,
        emailNotifications: true,
        adminEmail: 'admin@test.com',
        autoModeration: false,
        moderationThreshold: 3,
        postsPerPage: 20,
        enableComments: true,
        requireEmailVerification: true,
        sessionTimeout: 60,
        autoBackup: false,
        backupFrequency: 'weekly',
      };

      mockFetch.mockResolvedValue(mockSettings);

      const request = { url: 'https://example.com/api/admin/settings' } as any;
      const response = await GET(request, { params: Promise.resolve({}) });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.settings).toEqual(mockSettings);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('returns default settings when none exist', async () => {
      mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);
      mockFetch.mockResolvedValue(null);

      const request = { url: 'https://example.com/api/admin/settings' } as any;
      const response = await GET(request, { params: Promise.resolve({}) });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.settings).toBeDefined();
      expect(json.settings._type).toBe('adminSettings');
      expect(json.settings.siteName).toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('handles errors gracefully', async () => {
      mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);
      mockFetch.mockRejectedValue(new Error('Database error'));

      const request = { url: 'https://example.com/api/admin/settings' } as any;
      const response = await GET(request, { params: Promise.resolve({}) });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Failed to fetch admin settings');
      expect(json.message).toBe('Database error');
    });
  });

  describe('POST', () => {
    it('requires admin access', async () => {
      mockAuth.mockResolvedValue({ user: { role: 'user' } } as any);

      const request = {
        url: 'https://example.com/api/admin/settings',
        json: async () => ({ settings: {} }),
      } as any;

      const response = await POST(request, { params: Promise.resolve({}) });
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error).toBe('Admin access required');
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockPatch).not.toHaveBeenCalled();
    });

    it('returns error when settings data is missing', async () => {
      mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);

      const request = {
        url: 'https://example.com/api/admin/settings',
        json: async () => ({}),
      } as any;

      const response = await POST(request, { params: Promise.resolve({}) });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Settings data is required');
      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockPatch).not.toHaveBeenCalled();
    });

    it('creates new settings when none exist', async () => {
      mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);
      mockFetch.mockResolvedValue(null);

      const newSettings = {
        siteName: 'New Site',
        siteDescription: 'New Description',
        maintenanceMode: true,
      };

      const createdSettings = {
        _id: 'settings-1',
        _type: 'adminSettings',
        ...newSettings,
      };

      mockCreate.mockResolvedValue(createdSettings);

      const request = {
        url: 'https://example.com/api/admin/settings',
        json: async () => ({ settings: newSettings }),
      } as any;

      const response = await POST(request, { params: Promise.resolve({}) });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.settings).toEqual(createdSettings);
      expect(json.message).toBe('Settings saved successfully');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockPatch).not.toHaveBeenCalled();
    });

    it('updates existing settings', async () => {
      mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);

      const existingSettings = {
        _id: 'settings-1',
        _type: 'adminSettings',
        siteName: 'Old Site',
        siteDescription: 'Old Description',
      };

      mockFetch.mockResolvedValue(existingSettings);

      const updatedData = {
        siteName: 'Updated Site',
        maintenanceMode: true,
      };

      const updatedSettings = {
        ...existingSettings,
        ...updatedData,
      };

      mockCommit.mockResolvedValue(updatedSettings);

      const request = {
        url: 'https://example.com/api/admin/settings',
        json: async () => ({ settings: updatedData }),
      } as any;

      const response = await POST(request, { params: Promise.resolve({}) });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.settings).toEqual(updatedSettings);
      expect(json.message).toBe('Settings saved successfully');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockPatch).toHaveBeenCalledWith('settings-1');
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          _type: 'adminSettings',
          ...updatedData,
        })
      );
      expect(mockCommit).toHaveBeenCalledTimes(1);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('handles errors gracefully', async () => {
      mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);
      mockFetch.mockRejectedValue(new Error('Database error'));

      const request = {
        url: 'https://example.com/api/admin/settings',
        json: async () => ({ settings: { siteName: 'Test' } }),
      } as any;

      const response = await POST(request, { params: Promise.resolve({}) });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Failed to save admin settings');
      expect(json.message).toBe('Database error');
    });
  });

  describe('POST /backup', () => {
    it('requires admin access', async () => {
      mockAuth.mockResolvedValue({ user: { role: 'user' } } as any);

      const request = { url: 'https://example.com/api/admin/settings/backup' } as any;
      const response = await BACKUP_POST(request, { params: Promise.resolve({}) });
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error).toBe('Admin access required');
    });

    it('updates lastBackupDate when settings exist', async () => {
      mockAuth.mockResolvedValue({ user: { role: 'admin', id: 'admin-1' } } as any);
      mockFetch.mockResolvedValue({ _id: 'settings-1' });
      mockCommit.mockResolvedValue({
        _id: 'settings-1',
        lastBackupDate: '2024-01-01T00:00:00.000Z',
      });

      const request = { url: 'https://example.com/api/admin/settings/backup' } as any;
      const response = await BACKUP_POST(request, { params: Promise.resolve({}) });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.backupId).toMatch(/^backup-/);
      expect(json.settingsId).toBe('settings-1');
      expect(mockFetch).toHaveBeenCalled();
      expect(mockPatch).toHaveBeenCalledWith('settings-1');
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          lastBackupDate: expect.any(String),
          _type: 'adminSettings',
        })
      );
      expect(mockCommit).toHaveBeenCalled();
    });

    it('creates settings document when missing', async () => {
      mockAuth.mockResolvedValue({ user: { role: 'superAdmin', id: 'super-1' } } as any);
      mockFetch.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        _id: 'settings-2',
        _type: 'adminSettings',
        lastBackupDate: '2024-01-01T00:00:00.000Z',
      });

      const request = { url: 'https://example.com/api/admin/settings/backup' } as any;
      const response = await BACKUP_POST(request, { params: Promise.resolve({}) });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.settingsId).toBe('settings-2');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          _type: 'adminSettings',
          lastBackupDate: expect.any(String),
        })
      );
    });

    it('handles errors when backup fails', async () => {
      mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);
      mockFetch.mockResolvedValue({ _id: 'settings-1' });
      mockCommit.mockRejectedValue(new Error('commit failed'));

      const request = { url: 'https://example.com/api/admin/settings/backup' } as any;
      const response = await BACKUP_POST(request, { params: Promise.resolve({}) });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Failed to run admin settings backup');
    });
  });
});
