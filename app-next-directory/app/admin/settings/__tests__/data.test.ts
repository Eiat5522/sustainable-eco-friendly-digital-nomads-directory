import { getAdminSettings } from '../data';

// Mock dependencies
jest.mock('@/lib/absolute-url', () => ({
  getBaseUrl: jest.fn(async () => 'http://localhost:3000'),
}));

jest.mock('@/lib/server/cookies', () => ({
  getCookieHeader: jest.fn(async () => 'session=test-cookie'),
}));

const fetchMock = jest.fn();
const originalFetch = global.fetch;

describe('getAdminSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches admin settings successfully', async () => {
    const mockSettings = {
      settings: {
        _id: 'settings-1',
        _type: 'adminSettings',
        _createdAt: '2024-01-01T00:00:00Z',
        _updatedAt: '2024-01-02T00:00:00Z',
        siteName: 'Eco Nomads Directory',
        siteDescription: 'Find sustainable places for digital nomads',
        contactEmail: 'contact@example.com',
        maintenanceMode: false,
      },
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSettings,
    } as Response);

    const result = await getAdminSettings();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/admin/settings',
      expect.objectContaining({
        headers: { cookie: 'session=test-cookie' },
        signal: expect.any(AbortSignal),
      })
    );

    expect(result).toEqual({
      siteName: 'Eco Nomads Directory',
      siteDescription: 'Find sustainable places for digital nomads',
      contactEmail: 'contact@example.com',
      maintenanceMode: false,
    });
  });

  it('excludes metadata fields from returned data', async () => {
    const mockSettings = {
      settings: {
        _id: 'settings-1',
        _type: 'adminSettings',
        _createdAt: '2024-01-01T00:00:00Z',
        _updatedAt: '2024-01-02T00:00:00Z',
        siteName: 'Test Site',
        contactEmail: 'test@example.com',
      },
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSettings,
    } as Response);

    const result = await getAdminSettings();

    expect(result).not.toHaveProperty('_id');
    expect(result).not.toHaveProperty('_type');
    expect(result).not.toHaveProperty('_createdAt');
    expect(result).not.toHaveProperty('_updatedAt');
    expect(result).toHaveProperty('siteName');
    expect(result).toHaveProperty('contactEmail');
  });

  it('throws error when response is not ok', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Unauthorized' }),
    } as Response);

    await expect(getAdminSettings()).rejects.toThrow('Unauthorized');
  });

  it('throws default error message when error response has no error field', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    } as Response);

    await expect(getAdminSettings()).rejects.toThrow('Failed to fetch settings');
  });

  it('throws error when JSON parsing fails', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    } as Response);

    await expect(getAdminSettings()).rejects.toThrow('Failed to fetch settings');
  });

  it('clears timeout after successful fetch', async () => {
    const mockSettings = {
      settings: {
        _id: 'settings-1',
        _type: 'adminSettings',
        _createdAt: '2024-01-01T00:00:00Z',
        _updatedAt: '2024-01-02T00:00:00Z',
        siteName: 'Test Site',
      },
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSettings,
    } as Response);

    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    await getAdminSettings();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('clears timeout after failed fetch', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    await expect(getAdminSettings()).rejects.toThrow();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('handles network errors', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    await expect(getAdminSettings()).rejects.toThrow('Network error');
  });

  it('handles all settings fields correctly', async () => {
    const mockSettings = {
      settings: {
        _id: 'settings-1',
        _type: 'adminSettings',
        _createdAt: '2024-01-01T00:00:00Z',
        _updatedAt: '2024-01-02T00:00:00Z',
        siteName: 'Eco Nomads',
        siteDescription: 'Description',
        contactEmail: 'contact@test.com',
        maintenanceMode: true,
        maxListingsPerUser: 5,
        enableUserRegistration: true,
        moderationEnabled: false,
      },
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSettings,
    } as Response);

    const result = await getAdminSettings();

    expect(result).toEqual({
      siteName: 'Eco Nomads',
      siteDescription: 'Description',
      contactEmail: 'contact@test.com',
      maintenanceMode: true,
      maxListingsPerUser: 5,
      enableUserRegistration: true,
      moderationEnabled: false,
    });
  });

  it('returns empty object-like result when settings has only metadata fields', async () => {
    const mockSettings = {
      settings: {
        _id: 'settings-1',
        _type: 'adminSettings',
        _createdAt: '2024-01-01T00:00:00Z',
        _updatedAt: '2024-01-02T00:00:00Z',
      },
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSettings,
    } as Response);

    const result = await getAdminSettings();

    expect(result).toEqual({});
  });

  it('handles timeout correctly', async () => {
    const timeoutSpy = jest.spyOn(global, 'setTimeout');
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const mockSettings = {
      settings: {
        _id: 'settings-1',
        _type: 'adminSettings',
        _createdAt: '2024-01-01T00:00:00Z',
        _updatedAt: '2024-01-02T00:00:00Z',
        siteName: 'Test Site',
      },
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSettings,
    } as Response);

    await getAdminSettings();

    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 10000);
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('includes cookie header in request', async () => {
    const mockSettings = {
      settings: {
        _id: 'settings-1',
        _type: 'adminSettings',
        _createdAt: '2024-01-01T00:00:00Z',
        _updatedAt: '2024-01-02T00:00:00Z',
        siteName: 'Test Site',
      },
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSettings,
    } as Response);

    await getAdminSettings();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { cookie: 'session=test-cookie' },
      })
    );
  });
});
