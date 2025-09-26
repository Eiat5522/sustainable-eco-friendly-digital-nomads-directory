/**
 * Jest Test Suite for Redis Client with TypeScript-safe mock extensions
 * 
 * Tests covering:
 * 1. TypeScript-safe mock functionality
 * 2. Environment-based mock attachment
 * 3. Mock reset functionality for test isolation
 */

import { jest } from '@jest/globals';

// Mock the @upstash/redis module to avoid actual Redis connections
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    ping: jest.fn().mockResolvedValue('PONG'),
  })),
}));

describe('Redis Client TypeScript-safe Mocking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Ensure we're in test environment for mock attachment
    process.env.NODE_ENV = 'test';
    process.env.JEST_WORKER_ID = '1';
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
    delete process.env.JEST_WORKER_ID;
  });

  it('should attach mock helpers in test environment', async () => {
    const { getRedisClient } = await import('@/lib/redis');
    
    // Cast to mock type to access test methods
    const mockGetRedisClient = getRedisClient as jest.MockedFunction<typeof getRedisClient> & {
      mockReturnValue?: (client: any) => typeof getRedisClient;
      mockClear?: () => void;
      mockReset?: () => void;
    };

    // Verify mock methods are available
    expect(typeof mockGetRedisClient.mockReturnValue).toBe('function');
    expect(typeof mockGetRedisClient.mockClear).toBe('function');
    expect(typeof mockGetRedisClient.mockReset).toBe('function');
  });

  it('should allow setting mock return value', async () => {
    const { getRedisClient } = await import('@/lib/redis');
    
    const mockClient = {
      set: jest.fn(),
      get: jest.fn(),
      ping: jest.fn().mockResolvedValue('PONG'),
    };

    // Cast to mock type and use mockReturnValue
    const mockGetRedisClient = getRedisClient as jest.MockedFunction<typeof getRedisClient> & {
      mockReturnValue: (client: any) => typeof getRedisClient;
    };

    mockGetRedisClient.mockReturnValue(mockClient as any);

    // Verify the mock client is returned
    expect(getRedisClient()).toBe(mockClient);
  });

  it('should allow clearing mock state', async () => {
    const { getRedisClient } = await import('@/lib/redis');
    
    const mockClient = {
      set: jest.fn(),
      get: jest.fn(),
      ping: jest.fn().mockResolvedValue('PONG'),
    };

    // Cast to mock type
    const mockGetRedisClient = getRedisClient as jest.MockedFunction<typeof getRedisClient> & {
      mockReturnValue: (client: any) => typeof getRedisClient;
      mockClear: () => void;
    };

    // Set mock client
    mockGetRedisClient.mockReturnValue(mockClient as any);
    expect(getRedisClient()).toBe(mockClient);

    // Clear mock state
    mockGetRedisClient.mockClear();
    expect(getRedisClient()).toBeUndefined();
  });

  it('should allow resetting mock state and listeners', async () => {
    const { getRedisClient, onRedisClientChange } = await import('@/lib/redis');
    
    const mockClient = {
      set: jest.fn(),
      get: jest.fn(),
      ping: jest.fn().mockResolvedValue('PONG'),
    };

    // Cast to mock type
    const mockGetRedisClient = getRedisClient as jest.MockedFunction<typeof getRedisClient> & {
      mockReturnValue: (client: any) => typeof getRedisClient;
      mockReset: () => void;
    };

    // Add a listener
    const listener = jest.fn();
    const unsubscribe = onRedisClientChange(listener);

    // Set mock client
    mockGetRedisClient.mockReturnValue(mockClient as any);
    expect(listener).toHaveBeenCalledWith(mockClient);

    // Reset should clear client and listeners
    mockGetRedisClient.mockReset();
    expect(getRedisClient()).toBeUndefined();

    // Clean up
    unsubscribe();
  });

  it('should handle client changes through listeners', async () => {
    const { getRedisClient, onRedisClientChange } = await import('@/lib/redis');
    
    const listener = jest.fn();
    const unsubscribe = onRedisClientChange(listener);

    const mockClient = {
      set: jest.fn(),
      get: jest.fn(),
      ping: jest.fn().mockResolvedValue('PONG'),
    };

    // Cast to mock type
    const mockGetRedisClient = getRedisClient as jest.MockedFunction<typeof getRedisClient> & {
      mockReturnValue: (client: any) => typeof getRedisClient;
    };

    // Setting mock value should notify listeners
    mockGetRedisClient.mockReturnValue(mockClient as any);
    expect(listener).toHaveBeenCalledWith(mockClient);

    // Clean up
    unsubscribe();
  });

  it('should only attach mock helpers in test environment', async () => {
    // Remove test environment indicators
    delete process.env.NODE_ENV;
    delete process.env.JEST_WORKER_ID;
    
    jest.resetModules();
    
    const { getRedisClient } = await import('@/lib/redis');
    
    // Cast to check for mock methods
    const mockGetRedisClient = getRedisClient as any;

    // Mock methods should not be available outside test environment
    expect(mockGetRedisClient.mockReturnValue).toBeUndefined();
    expect(mockGetRedisClient.mockClear).toBeUndefined();
    expect(mockGetRedisClient.mockReset).toBeUndefined();
  });
});