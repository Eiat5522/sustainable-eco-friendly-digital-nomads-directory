/**
 * Integration Test Suite for Redis Client TypeScript Improvements
 * 
 * This test validates that our TypeScript-safe mock extensions properly address
 * the issues identified in the problem statement:
 * 1. TypeScript function property extensions causing type safety issues
 * 2. Potential race conditions with module-level mock attachment
 * 3. Using typed Jest mocks instead of manual property extensions
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

describe('Redis TypeScript Improvements Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.NODE_ENV;
    delete process.env.JEST_WORKER_ID;
  });

  describe('TypeScript Type Safety Improvements', () => {
    it('should use proper type casting instead of unsafe property extensions', async () => {
      // Ensure we're in test environment for mock attachment
      process.env.NODE_ENV = 'test';
      
      const { getRedisClient } = await import('@/lib/redis');
      
      // Our new approach uses proper TypeScript casting that doesn't bypass the type system
      // This should compile without TypeScript errors about missing properties
      const mockClient = getRedisClient as jest.MockedFunction<typeof getRedisClient> & {
        mockReturnValue?: (client: any) => typeof getRedisClient;
        mockClear?: () => void;
        mockReset?: () => void;
      };

      // Verify the casting works and methods are available
      expect(typeof mockClient.mockReturnValue).toBe('function');
      expect(typeof mockClient.mockClear).toBe('function');
      expect(typeof mockClient.mockReset).toBe('function');
    });

    it('should not pollute production code with test-specific extensions', async () => {
      // Remove test environment indicators
      delete process.env.NODE_ENV;
      delete process.env.JEST_WORKER_ID;
      
      jest.resetModules();
      
      const { getRedisClient } = await import('@/lib/redis');
      
      // In non-test environments, mock helpers should not be attached
      const anyClient = getRedisClient as any;
      expect(anyClient.mockReturnValue).toBeUndefined();
      expect(anyClient.mockClear).toBeUndefined();
      expect(anyClient.mockReset).toBeUndefined();
    });
  });

  describe('Race Condition Prevention', () => {
    it('should only attach mock helpers in test environments', async () => {
      // Test with NODE_ENV=test
      process.env.NODE_ENV = 'test';
      jest.resetModules();
      
      const { getRedisClient: testClient } = await import('@/lib/redis');
      const testClientAny = testClient as any;
      expect(testClientAny.mockReturnValue).toBeDefined();
      
      // Test with JEST_WORKER_ID set
      delete process.env.NODE_ENV;
      process.env.JEST_WORKER_ID = '1';
      jest.resetModules();
      
      const { getRedisClient: jestClient } = await import('@/lib/redis');
      const jestClientAny = jestClient as any;
      expect(jestClientAny.mockReturnValue).toBeDefined();
      
      // Test with neither set
      delete process.env.JEST_WORKER_ID;
      jest.resetModules();
      
      const { getRedisClient: prodClient } = await import('@/lib/redis');
      const prodClientAny = prodClient as any;
      expect(prodClientAny.mockReturnValue).toBeUndefined();
    });

    it('should provide proper test isolation with mockReset', async () => {
      process.env.NODE_ENV = 'test';
      jest.resetModules();
      
      const { getRedisClient, onRedisClientChange } = await import('@/lib/redis');
      
      const mockClient = {
        set: jest.fn(),
        get: jest.fn(),
        ping: jest.fn().mockResolvedValue('PONG'),
      };

      // Cast to mock type with proper typing
      const typedMockClient = getRedisClient as jest.MockedFunction<typeof getRedisClient> & {
        mockReturnValue: (client: any) => typeof getRedisClient;
        mockReset: () => void;
      };

      // Set up some state
      const listener = jest.fn();
      const unsubscribe = onRedisClientChange(listener);
      typedMockClient.mockReturnValue(mockClient as any);

      // Verify state is set
      expect(getRedisClient()).toBe(mockClient);
      expect(listener).toHaveBeenCalledWith(mockClient);

      // Reset should clear everything for proper test isolation
      typedMockClient.mockReset();
      
      // Verify state is cleared
      expect(getRedisClient()).toBeUndefined();

      // Clean up
      unsubscribe();
    });
  });

  describe('Proper Jest Mock Integration', () => {
    it('should work seamlessly with standard Jest mocking patterns', async () => {
      process.env.NODE_ENV = 'test';
      jest.resetModules();
      
      const { getRedisClient } = await import('@/lib/redis');
      
      // In our implementation, getRedisClient is a regular function that we can cast to mock
      // This demonstrates the proper TypeScript-safe approach
      const mockRedisClient = getRedisClient as jest.MockedFunction<typeof getRedisClient>;
      
      // Our additional helpers should be available in test environment
      const extendedMock = mockRedisClient as typeof mockRedisClient & {
        mockReturnValue?: (client: any) => typeof getRedisClient;
        mockClear?: () => void;
      };
      
      // Our custom mock helpers should be available
      expect(typeof extendedMock.mockReturnValue).toBe('function');
      expect(typeof extendedMock.mockClear).toBe('function');
      
      // And they should work correctly
      const fakeClient = { ping: jest.fn() };
      extendedMock.mockReturnValue!(fakeClient as any);
      expect(getRedisClient()).toBe(fakeClient);
    });

    it('should maintain compatibility with existing mock patterns', async () => {
      process.env.NODE_ENV = 'test';
      jest.resetModules();
      
      const { getRedisClient } = await import('@/lib/redis');
      
      // Test that we can still use the mock in traditional Jest patterns
      const mockGetRedisClient = getRedisClient as jest.MockedFunction<typeof getRedisClient>;
      
      const fakeMockClient = { ping: jest.fn().mockResolvedValue('PONG') };
      mockGetRedisClient.mockReturnValue(fakeMockClient as any);
      
      expect(getRedisClient()).toBe(fakeMockClient);
    });
  });

  describe('TypeScript Compilation Safety', () => {
    it('should not cause TypeScript compilation errors', async () => {
      process.env.NODE_ENV = 'test';
      
      const { getRedisClient } = await import('@/lib/redis');
      
      // This pattern should compile without TypeScript errors
      // Previously would cause: "Property 'mockReturnValue' does not exist on type"
      const mockClient = getRedisClient as jest.MockedFunction<typeof getRedisClient> & {
        mockReturnValue: (client: any) => typeof getRedisClient;
        mockClear: () => void;
      };

      // These calls should not cause TypeScript errors
      mockClient.mockReturnValue({ ping: jest.fn() } as any);
      mockClient.mockClear();

      // Verify they work at runtime too
      expect(getRedisClient()).toBeUndefined(); // After mockClear
    });
  });
});