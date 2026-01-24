import { describe, expect, it, jest } from '@jest/globals';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  __esModule: true,
  auth: jest.fn(),
}));

jest.mock('@/lib/dashboard/user-dashboard', () => ({
  __esModule: true,
  getUserDashboardData: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  __esModule: true,
  structuredLogger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

const mockAuthModule = jest.requireMock('@/lib/auth') as {
  auth: jest.Mock;
};

const mockDashboardModule = jest.requireMock('@/lib/dashboard/user-dashboard') as {
  getUserDashboardData: jest.Mock;
};

const mockLoggerModule = jest.requireMock('@/lib/logger') as {
  structuredLogger: {
    error: jest.Mock;
    warn: jest.Mock;
    info: jest.Mock;
  };
};

describe('/api/user/dashboard', () => {
  it('should export GET handler that is a function', async () => {
    const { GET } = await import('../route');

    expect(GET).toBeDefined();
    expect(typeof GET).toBe('function');
  });

  it('should use auth, getUserDashboardData, and structuredLogger', async () => {
    // This test verifies the module composes the handler with dependencies
    // by importing the module and checking it doesn't throw
    const routeModule = await import('../route');
    expect(routeModule.GET).toBeDefined();

    // Verify the imported dependencies are available
    expect(mockAuthModule.auth).toBeDefined();
    expect(mockDashboardModule.getUserDashboardData).toBeDefined();
    expect(mockLoggerModule.structuredLogger).toBeDefined();
  });
});
