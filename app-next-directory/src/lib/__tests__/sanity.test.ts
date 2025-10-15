import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

const ORIGINAL_ENV = { ...process.env };

const createClientMock = jest.fn();
const imageBuilderMock = jest.fn();

jest.mock('@sanity/client', () => ({
  __esModule: true,
  createClient: (...args: unknown[]) => createClientMock(...args),
}));
jest.mock('@sanity/image-url', () => ({
  __esModule: true,
  default: (...args: unknown[]) => imageBuilderMock(...args),
}));

describe('sanity.js helpers', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      NEXT_PUBLIC_SANITY_PROJECT_ID: 'proj',
      NEXT_PUBLIC_SANITY_DATASET: 'dataset',
      SANITY_API_TOKEN: 'token',
      NODE_ENV: 'production',
    };
    createClientMock.mockReset();
    imageBuilderMock.mockReset();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('creates read and preview clients and builds image URLs', async () => {
    const image = jest.fn(() => 'https://cdn.sanity.io/image/123');
    imageBuilderMock.mockReturnValue({ image });

    const readClient = { fetch: jest.fn() };
    const previewClient = { fetch: jest.fn() };

    createClientMock
      .mockImplementationOnce(() => readClient)
      .mockImplementationOnce(() => previewClient)
      .mockImplementation(() => ({ fetch: jest.fn() }));

    const mod = await import('../sanity.js');

    expect(createClientMock).toHaveBeenCalledWith({
      projectId: 'proj',
      dataset: 'dataset',
      useCdn: true,
      apiVersion: '2024-05-23',
      token: 'token',
    });

    expect(imageBuilderMock).toHaveBeenCalledWith(readClient);
    const url = mod.urlFor({ _ref: 'imageRef' });
    expect(url).toBe('https://cdn.sanity.io/image/123');

    expect(mod.getClient()).toBe(readClient);
    expect(mod.getClient(true)).toBe(previewClient);
  });
});
