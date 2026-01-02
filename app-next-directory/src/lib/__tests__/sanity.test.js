import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';

// Mock environment variables
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project-id';
process.env.NEXT_PUBLIC_SANITY_DATASET = 'test-dataset';
process.env.SANITY_API_TOKEN = 'test-api-token';

// Hoisted mock for '@sanity/client'
const mockCreateClient = jest.fn();
jest.mock('@sanity/client', () => ({
  createClient: mockCreateClient,
}));

// Hoisted mock for '@sanity/image-url'
const mockImage = jest.fn();
const mockImageUrlBuilder = jest.fn(() => ({
  image: mockImage,
}));
jest.mock('@sanity/image-url', () => ({
  __esModule: true, // Required for mocking default exports in ES Modules
  default: mockImageUrlBuilder,
}));

describe('Sanity Library', () => {
  let client, previewClient, urlFor, getClient;
  let recordedClientConfigs = [];
  const originalNodeEnv = process.env.NODE_ENV;
  const standardClientInstance = { id: 'standard' };
  const previewClientInstance = { id: 'preview' };

  beforeAll(async () => {
    // Set NODE_ENV to 'production' to test the 'useCdn' flag correctly
    process.env.NODE_ENV = 'production';
    delete process.env.DISABLE_SANITY_DURING_BUILD;

    jest.resetModules();
    mockCreateClient.mockReset();
    mockImageUrlBuilder.mockClear();

    // Configure mock return values BEFORE the module is imported
    mockCreateClient
      .mockReturnValueOnce(standardClientInstance)
      .mockReturnValueOnce(previewClientInstance);

    // Dynamically import the module to ensure mocks and env vars are applied
    const sanityModule = await import('../sanity/client');
    // Get actual clients using the exported helper to trigger initialization
    client = await sanityModule.getClient();
    previewClient = await sanityModule.getClient(true);
    urlFor = sanityModule.urlFor;
    getClient = sanityModule.getClient;
    recordedClientConfigs = mockCreateClient.mock.calls.map(([config]) => config);
  });

  afterAll(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
    jest.resetModules();
  });

  describe('Initialization', () => {
    it('should create the standard client with production config (useCdn: false)', () => {
      const config = recordedClientConfigs[0];
      expect(config).toEqual(
        expect.objectContaining({
          projectId: 'test-project-id',
          dataset: 'test-dataset',
          useCdn: false,
          token: 'test-api-token',
        })
      );
    });

    it('should create the preview client with preview config (useCdn: false)', () => {
      const config = recordedClientConfigs[1];
      expect(config).toEqual(
        expect.objectContaining({
          projectId: 'test-project-id',
          dataset: 'test-dataset',
          useCdn: false,
          token: 'test-api-token',
        })
      );
    });

    it('should export the correct client instances returned by the mock', () => {
      expect(client).toBe(standardClientInstance);
      expect(previewClient).toBe(previewClientInstance);
    });
  });

  describe('getClient', () => {
    it('should return the preview client when usePreview is true', async () => {
      expect(await getClient(true)).toBe(previewClientInstance);
    });

    it('should return the standard client when usePreview is false', async () => {
      expect(await getClient(false)).toBe(standardClientInstance);
    });

    it('should return the standard client by default', async () => {
      expect(await getClient()).toBe(standardClientInstance);
    });
  });

  describe('urlFor', () => {
    it('should use the configured image builder to process the source', () => {
      const mockSource = { _type: 'image', asset: { _ref: 'image-asset-id' } };
      urlFor(mockSource);
      expect(mockImage).toHaveBeenCalledWith(mockSource);
    });
  });
});
