import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { createDashboardHandler, normalizeMonthWindow } from '../route-helpers';

describe('/api/user/dashboard/route-helpers', () => {
  describe('normalizeMonthWindow', () => {
    it('should return default window when param is null', () => {
      expect(normalizeMonthWindow(null)).toBe(3);
    });

    it('should return default window when param is empty string', () => {
      expect(normalizeMonthWindow('')).toBe(3);
    });

    it('should return default window when param is not a number', () => {
      expect(normalizeMonthWindow('abc')).toBe(3);
      expect(normalizeMonthWindow('12.5')).toBe(12); // parseInt('12.5', 10) returns 12
      expect(normalizeMonthWindow('NaN')).toBe(3);
    });

    it('should clamp value to minimum of 1', () => {
      expect(normalizeMonthWindow('0')).toBe(1);
      expect(normalizeMonthWindow('-5')).toBe(1);
    });

    it('should clamp value to maximum of 12', () => {
      expect(normalizeMonthWindow('13')).toBe(12);
      expect(normalizeMonthWindow('100')).toBe(12);
    });

    it('should parse valid numbers correctly', () => {
      expect(normalizeMonthWindow('1')).toBe(1);
      expect(normalizeMonthWindow('6')).toBe(6);
      expect(normalizeMonthWindow('12')).toBe(12);
    });

    it('should handle numbers with leading/trailing whitespace', () => {
      expect(normalizeMonthWindow('  5  ')).toBe(5);
    });
  });

  describe('createDashboardHandler', () => {
    const mockAuthFn = jest.fn();
    const mockFetchDashboard = jest.fn();
    const mockLogger = {
      error: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return 204 when headers() is unavailable during prerender', async () => {
      mockAuthFn.mockRejectedValue(new Error('headers() unavailable'));

      const handler = createDashboardHandler({
        authFn: mockAuthFn,
        fetchDashboard: mockFetchDashboard,
        logger: mockLogger,
      });

      const mockRequest = {
        url: 'https://example.com/api/user/dashboard',
      } as any;

      const response = await handler(mockRequest);

      expect(response.status).toBe(204);
      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockFetchDashboard).not.toHaveBeenCalled();
    });

    it('should return 204 when During prerendering error occurs', async () => {
      mockAuthFn.mockRejectedValue(new Error('During prerendering, something failed'));

      const handler = createDashboardHandler({
        authFn: mockAuthFn,
        fetchDashboard: mockFetchDashboard,
        logger: mockLogger,
      });

      const mockRequest = {
        url: 'https://example.com/api/user/dashboard',
      } as any;

      const response = await handler(mockRequest);

      expect(response.status).toBe(204);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', async () => {
      mockAuthFn.mockResolvedValue(null);

      const handler = createDashboardHandler({
        authFn: mockAuthFn,
        fetchDashboard: mockFetchDashboard,
        logger: mockLogger,
      });

      const mockRequest = {
        url: 'https://example.com/api/user/dashboard',
      } as any;

      const response = await handler(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should return 401 when user has no id', async () => {
      mockAuthFn.mockResolvedValue({
        user: { role: 'user' },
      });

      const handler = createDashboardHandler({
        authFn: mockAuthFn,
        fetchDashboard: mockFetchDashboard,
        logger: mockLogger,
      });

      const mockRequest = {
        url: 'https://example.com/api/user/dashboard',
      } as any;

      const response = await handler(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should return dashboard data for authenticated user', async () => {
      const mockDashboard = {
        stats: { totalListings: 10 },
        recentActivity: [],
      };

      mockAuthFn.mockResolvedValue({
        user: {
          id: 'user-123',
          role: 'user',
          name: 'Test User',
          email: 'test@example.com',
        },
      });
      mockFetchDashboard.mockResolvedValue(mockDashboard);

      const handler = createDashboardHandler({
        authFn: mockAuthFn,
        fetchDashboard: mockFetchDashboard,
        logger: mockLogger,
      });

      const mockRequest = {
        url: 'https://example.com/api/user/dashboard',
      } as any;

      const response = await handler(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.dashboard).toEqual(mockDashboard);
      expect(mockFetchDashboard).toHaveBeenCalledWith(
        {
          id: 'user-123',
          role: 'user',
          name: 'Test User',
          email: 'test@example.com',
        },
        { months: 3 }
      );
    });

    it('should use default months parameter when not provided', async () => {
      const mockDashboard = { stats: {} };

      mockAuthFn.mockResolvedValue({
        user: { id: 'user-123', role: 'user', name: 'Test', email: 'test@example.com' },
      });
      mockFetchDashboard.mockResolvedValue(mockDashboard);

      const handler = createDashboardHandler({
        authFn: mockAuthFn,
        fetchDashboard: mockFetchDashboard,
        logger: mockLogger,
      });

      const mockRequest = {
        url: 'https://example.com/api/user/dashboard',
      } as any;

      const response = await handler(mockRequest);

      expect(response.status).toBe(200);
      expect(mockFetchDashboard).toHaveBeenCalledWith(expect.any(Object), { months: 3 });
    });

    it('should use custom months parameter when provided', async () => {
      const mockDashboard = { stats: {} };

      mockAuthFn.mockResolvedValue({
        user: { id: 'user-123', role: 'user', name: 'Test', email: 'test@example.com' },
      });
      mockFetchDashboard.mockResolvedValue(mockDashboard);

      const handler = createDashboardHandler({
        authFn: mockAuthFn,
        fetchDashboard: mockFetchDashboard,
        logger: mockLogger,
      });

      const mockRequest = {
        url: 'https://example.com/api/user/dashboard?months=6',
      } as any;

      const response = await handler(mockRequest);

      expect(response.status).toBe(200);
      expect(mockFetchDashboard).toHaveBeenCalledWith(expect.any(Object), { months: 6 });
    });

    it('should return 404 when dashboard is null', async () => {
      mockAuthFn.mockResolvedValue({
        user: { id: 'user-123', role: 'user', name: 'Test', email: 'test@example.com' },
      });
      mockFetchDashboard.mockResolvedValue(null);

      const handler = createDashboardHandler({
        authFn: mockAuthFn,
        fetchDashboard: mockFetchDashboard,
        logger: mockLogger,
      });

      const mockRequest = {
        url: 'https://example.com/api/user/dashboard',
      } as any;

      const response = await handler(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Dashboard unavailable');
    });

    it('should handle errors and return 500', async () => {
      mockAuthFn.mockResolvedValue({
        user: { id: 'user-123', role: 'user', name: 'Test', email: 'test@example.com' },
      });
      mockFetchDashboard.mockRejectedValue(new Error('Database error'));

      const handler = createDashboardHandler({
        authFn: mockAuthFn,
        fetchDashboard: mockFetchDashboard,
        logger: mockLogger,
      });

      const mockRequest = {
        url: 'https://example.com/api/user/dashboard',
      } as any;

      const response = await handler(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Unable to load dashboard data');
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[user-dashboard] GET failed',
        expect.any(Error),
        { route: '/api/user/dashboard' }
      );
    });

    it('should catch and handle non-prerender auth errors as 500', async () => {
      mockAuthFn.mockRejectedValue(new Error('Authentication service down'));

      const handler = createDashboardHandler({
        authFn: mockAuthFn,
        fetchDashboard: mockFetchDashboard,
        logger: mockLogger,
      });

      const mockRequest = {
        url: 'https://example.com/api/user/dashboard',
      } as any;

      // The handler catches all errors and returns 500, not rethrows
      const response = await handler(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Unable to load dashboard data');
    });

    it('should handle user with null name and email', async () => {
      const mockDashboard = { stats: {} };

      mockAuthFn.mockResolvedValue({
        user: { id: 'user-123', role: 'user', name: null, email: null },
      });
      mockFetchDashboard.mockResolvedValue(mockDashboard);

      const handler = createDashboardHandler({
        authFn: mockAuthFn,
        fetchDashboard: mockFetchDashboard,
        logger: mockLogger,
      });

      const mockRequest = {
        url: 'https://example.com/api/user/dashboard',
      } as any;

      const response = await handler(mockRequest);

      expect(response.status).toBe(200);
      expect(mockFetchDashboard).toHaveBeenCalledWith(
        {
          id: 'user-123',
          role: 'user',
          name: null,
          email: null,
        },
        { months: 3 }
      );
    });

    it('should use default role when not provided', async () => {
      const mockDashboard = { stats: {} };

      mockAuthFn.mockResolvedValue({
        user: { id: 'user-123', name: 'Test', email: 'test@example.com' },
      });
      mockFetchDashboard.mockResolvedValue(mockDashboard);

      const handler = createDashboardHandler({
        authFn: mockAuthFn,
        fetchDashboard: mockFetchDashboard,
        logger: mockLogger,
      });

      const mockRequest = {
        url: 'https://example.com/api/user/dashboard',
      } as any;

      const response = await handler(mockRequest);

      expect(response.status).toBe(200);
      expect(mockFetchDashboard).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'user',
        }),
        { months: 3 }
      );
    });

    it('should work without logger parameter', async () => {
      const mockDashboard = { stats: {} };

      mockAuthFn.mockResolvedValue({
        user: { id: 'user-123', role: 'user', name: 'Test', email: 'test@example.com' },
      });
      mockFetchDashboard.mockResolvedValue(mockDashboard);

      const handler = createDashboardHandler({
        authFn: mockAuthFn,
        fetchDashboard: mockFetchDashboard,
      });

      const mockRequest = {
        url: 'https://example.com/api/user/dashboard',
      } as any;

      const response = await handler(mockRequest);

      expect(response.status).toBe(200);
    });

    it('should handle prerender error without logger', async () => {
      mockAuthFn.mockRejectedValue(new Error('headers() unavailable'));

      const handler = createDashboardHandler({
        authFn: mockAuthFn,
        fetchDashboard: mockFetchDashboard,
      });

      const mockRequest = {
        url: 'https://example.com/api/user/dashboard',
      } as any;

      const response = await handler(mockRequest);

      expect(response.status).toBe(204);
    });

    it('should handle general error without logger parameter', async () => {
      mockAuthFn.mockResolvedValue({
        user: { id: 'user-123', role: 'user', name: 'Test', email: 'test@example.com' },
      });
      mockFetchDashboard.mockRejectedValue(new Error('Database error'));

      const handler = createDashboardHandler({
        authFn: mockAuthFn,
        fetchDashboard: mockFetchDashboard,
      });

      const mockRequest = {
        url: 'https://example.com/api/user/dashboard',
      } as any;

      const response = await handler(mockRequest);

      expect(response.status).toBe(500);
    });
  });
});
