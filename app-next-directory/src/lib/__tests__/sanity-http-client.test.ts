import { jest } from '@jest/globals';
import { describe, it, expect, beforeEach } from '@jest/globals';

// --- Environment Setup ---
const MOCK_ENV = {
  NEXT_PUBLIC_SANITY_PROJECT_ID: 'test-project-id',
  NEXT_PUBLIC_SANITY_DATASET: 'test-dataset',
  SANITY_API_TOKEN: 'test-api-token',
};
Object.assign(process.env, MOCK_ENV);

// --- Mocking Sanity Client ---
const mockCommit = jest.fn();
const mockSet = jest.fn(() => ({ commit: mockCommit }));
const mockPatch = jest.fn(() => ({ set: mockSet }));
const mockTransaction = jest.fn(() => ({
  create: jest.fn(),
  commit: jest.fn(),
}));
const mockReadClient = {
  fetch: jest.fn(),
  withConfig: jest.fn(),
};
const mockWriteClient = {
  create: jest.fn(),
  delete: jest.fn(),
  assets: { upload: jest.fn() },
  patch: mockPatch,
  transaction: mockTransaction,
};

// Hoisted mock for the LOCAL './sanity/client' module, which is the one being imported
jest.mock('../sanity/client', () => ({
  createClient: jest.fn((config) => (config.token ? mockWriteClient : mockReadClient)),
}));

describe('SanityHTTPClient', () => {
  let SanityHTTPClientModule: any;
  let mockedCreateClient: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset chained mocks
    mockSet.mockReturnValue({ commit: mockCommit });
    mockPatch.mockReturnValue({ set: mockSet });

    // Dynamically import the mocked module to get a fresh reference to the mock function
    const mockModule = await import('../sanity/client');
    mockedCreateClient = mockModule.createClient as jest.Mock;

    // Isolate and dynamically import the module under test
    await jest.isolateModulesAsync(async () => {
      SanityHTTPClientModule = await import('../sanity-http-client');
    });
  });

  describe('Initialization', () => {
    it('should create separate read and write clients with correct configurations', () => {
      new SanityHTTPClientModule.SanityHTTPClient();

      expect(mockedCreateClient).toHaveBeenCalledTimes(2);

      // First call (read client) should not have a token.
      expect(mockedCreateClient.mock.calls[0][0].token).toBeUndefined();
      // useCdn should be false because NODE_ENV is 'test' by default in Jest
      expect(mockedCreateClient.mock.calls[0][0].useCdn).toBe(false);

      // Second call (write client) should have a token and useCdn should be explicitly false.
      expect(mockedCreateClient.mock.calls[1][0].token).toBe(MOCK_ENV.SANITY_API_TOKEN);
      expect(mockedCreateClient.mock.calls[1][0].useCdn).toBe(false);
    });
  });

  describe('Query Operations', () => {
    it('should use the read client for queries', async () => {
      const client = new SanityHTTPClientModule.SanityHTTPClient();
      mockReadClient.fetch.mockResolvedValue(['result']);

      await client.query('*');

      expect(mockReadClient.fetch).toHaveBeenCalledWith('*', undefined);
    });
  });

  describe('CRUD Operations', () => {
    it('should use the write client for create', async () => {
      const client = new SanityHTTPClientModule.SanityHTTPClient();
      // Fix: Provide a valid resolved value to prevent the 'undefined' error
      mockWriteClient.create.mockResolvedValue({ _id: 'doc1', _type: 'test' });
      await client.create({ _type: 'test' });
      expect(mockWriteClient.create).toHaveBeenCalled();
    });

    it('should use the write client for update', async () => {
      const client = new SanityHTTPClientModule.SanityHTTPClient();
      mockCommit.mockResolvedValue({}); // Ensure the commit promise resolves
      await client.update('doc1', { title: 'new' });
      expect(mockPatch).toHaveBeenCalledWith('doc1');
    });

    it('should use the write client for delete', async () => {
      const client = new SanityHTTPClientModule.SanityHTTPClient();
      // Fix: Provide a valid resolved value to prevent the 'undefined' error
      mockWriteClient.delete.mockResolvedValue({ results: [{ documentId: 'doc1' }] });
      await client.delete('doc1');
      expect(mockWriteClient.delete).toHaveBeenCalledWith('doc1');
    });
  });

  describe('Singleton Accessor', () => {
    it('should provide a singleton instance via getSanityHTTPClient', () => {
      const instance1 = SanityHTTPClientModule.getSanityHTTPClient();
      const instance2 = SanityHTTPClientModule.getSanityHTTPClient();
      expect(instance1).toBe(instance2);
      expect(mockedCreateClient).toHaveBeenCalledTimes(2); // Should not re-initialize
    });
  });
});
