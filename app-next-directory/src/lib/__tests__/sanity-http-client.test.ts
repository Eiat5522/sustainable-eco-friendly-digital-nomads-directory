import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

const ORIGINAL_ENV = { ...process.env };

const createClientMock = jest.fn();

jest.mock('../sanity/client', () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

describe('SanityHTTPClient', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      NEXT_PUBLIC_SANITY_PROJECT_ID: 'proj',
      NEXT_PUBLIC_SANITY_DATASET: 'dataset',
      SANITY_API_TOKEN: 'token-123',
      NODE_ENV: 'test',
    };
    createClientMock.mockReset();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    process.env = { ...ORIGINAL_ENV };
  });

  const setupClients = () => {
    const previewFetch = jest.fn();
    const readClient = {
      fetch: jest.fn(),
      withConfig: jest.fn(() => ({ fetch: previewFetch })),
    };

    const writeClient = {
      create: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(() => ({
        set: jest.fn(() => ({ commit: jest.fn().mockResolvedValue({ _id: 'doc' }) })),
      })),
      assets: { upload: jest.fn() },
      transaction: jest.fn(() => ({
        create: jest.fn(),
        commit: jest.fn().mockResolvedValue({ results: [{ document: { _id: 'batch' } }] }),
      })),
    };

    createClientMock
      .mockImplementationOnce(() => readClient)
      .mockImplementationOnce(() => writeClient)
      .mockImplementation(() => ({ fetch: jest.fn(), withConfig: jest.fn(() => ({ fetch: jest.fn() })) }));

    return { readClient, writeClient, previewFetch };
  };

  it('validates required environment variables at construction', async () => {
    delete process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
    await expect(
      import('../sanity-http-client').then(({ getSanityHTTPClient }) => getSanityHTTPClient())
    ).rejects.toThrow('Missing required environment variable');
    expect(createClientMock).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('performs queries and supports preview mode', async () => {
    const { readClient, previewFetch } = setupClients();
    const { getSanityHTTPClient } = await import('../sanity-http-client');
    const client = getSanityHTTPClient();

    readClient.fetch.mockResolvedValueOnce([{ _id: 'one' }]);
    previewFetch.mockResolvedValueOnce([{ _id: 'preview' }]);

    const result = await client.query('*[_type == "listing"]');
    expect(readClient.fetch).toHaveBeenCalledWith('*[_type == "listing"]', undefined);
    expect(result).toEqual([{ _id: 'one' }]);

    await client.query('*', {}, { preview: true });
    expect(previewFetch).toHaveBeenCalled();
    expect(createClientMock).toHaveBeenCalledTimes(2);
    expect(createClientMock).toHaveBeenNthCalledWith(1, {
      projectId: 'proj',
      dataset: 'dataset',
      apiVersion: '2025-05-24',
      useCdn: false,
    });
    expect(createClientMock).toHaveBeenNthCalledWith(2, {
      projectId: 'proj',
      dataset: 'dataset',
      apiVersion: '2025-05-24',
      useCdn: false,
      token: 'token-123',
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('requires an API token for mutations', async () => {
    const { writeClient } = setupClients();
    const { getSanityHTTPClient } = await import('../sanity-http-client');
    const client = getSanityHTTPClient();

    process.env.SANITY_API_TOKEN = '';

    await expect(client.create({})).rejects.toThrow('No API token');

    process.env.SANITY_API_TOKEN = 'token-123';
    writeClient.create.mockResolvedValue({ _id: 'doc-1' });

    const created = await client.create({ _type: 'listing' });
    expect(writeClient.create).toHaveBeenCalledWith({ _type: 'listing' });
    expect(created).toEqual({ _id: 'doc-1' });
  });

  it('rejects non-image uploads and passes options to the asset uploader', async () => {
    const { writeClient } = setupClients();
    const { getSanityHTTPClient } = await import('../sanity-http-client');
    const client = getSanityHTTPClient();

    await expect(
      client.uploadAsset(Buffer.from('data'), { contentType: 'text/plain' }),
    ).rejects.toThrow('Only image/* content types are supported');

    writeClient.assets.upload.mockResolvedValue({ _id: 'image-1' });

    const image = await client.uploadAsset(Buffer.from('data'), {
      contentType: 'image/jpeg',
      filename: 'photo.jpg',
    });

    expect(writeClient.assets.upload).toHaveBeenCalledWith(
      'image',
      expect.any(Buffer),
      expect.objectContaining({ filename: 'photo.jpg', contentType: 'image/jpeg' }),
    );
    expect(image.asset._ref).toBe('image-1');
  });
});
