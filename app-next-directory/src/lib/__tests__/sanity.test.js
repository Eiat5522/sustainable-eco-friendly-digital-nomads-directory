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
  const originalNodeEnv = process.env.NODE_ENV;
  const standardClientInstance = { id: 'standard' };
  const previewClientInstance = { id: 'preview' };

  beforeAll(async () => {
    // Set NODE_ENV to 'production' to test the 'useCdn' flag correctly
    process.env.NODE_ENV = 'production';

    // Configure mock return values BEFORE the module is imported
    mockCreateClient
      .mockReturnValueOnce(standardClientInstance)
      .mockReturnValueOnce(previewClientInstance);

    // Dynamically import the module to ensure mocks and env vars are applied
    const sanityModule = await import('../sanity.js');
    // Get actual clients using the exported helper to trigger initialization
    client = sanityModule.getClient();
    previewClient = sanityModule.getClient(true);
    urlFor = sanityModule.urlFor;
    getClient = sanityModule.getClient;
  });

  afterAll(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
    jest.resetModules();
  });

  describe('Initialization', () => {
    it('should create the standard client with production config (useCdn: true)', () => {
      expect(mockCreateClient).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          projectId: 'test-project-id',
          dataset: 'test-dataset',
          useCdn: true,
          token: 'test-api-token',
        })
      );
    });

    it('should create the preview client with preview config (useCdn: false)', () => {
      expect(mockCreateClient).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          projectId: 'test-project-id',
          dataset: 'test-dataset',
          useCdn: false,
          token: 'test-api-token',
        })
      );
    });

    it('should initialize the image URL builder with the standard client', () => {
      // Access urlFor to ensure builder initialized
      urlFor({ _type: 'image' });
      expect(mockImageUrlBuilder).toHaveBeenCalledWith(standardClientInstance);
    });

    it('should export the correct client instances returned by the mock', () => {
      expect(client).toBe(standardClientInstance);
      expect(previewClient).toBe(previewClientInstance);
    });
  });

  describe('getClient', () => {
    it('should return the preview client when usePreview is true', () => {
      expect(getClient(true)).toBe(previewClientInstance);
    });

    it('should return the standard client when usePreview is false', () => {
      expect(getClient(false)).toBe(standardClientInstance);
    });

    it('should return the standard client by default', () => {
      expect(getClient()).toBe(standardClientInstance);
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
