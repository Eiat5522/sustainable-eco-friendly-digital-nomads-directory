import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

const ORIGINAL_ENV = { ...process.env };

const createClientMock = jest.fn();
const cachedClientMock = { fetch: jest.fn() };

jest.mock('next-sanity', () => ({ createClient: (...args: unknown[]) => createClientMock(...args) }));
jest.mock('../sanity/cached-client', () => ({ cachedClient: cachedClientMock }));

describe('sanity.utils', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      NEXT_PUBLIC_SANITY_PROJECT_ID: 'proj',
      NEXT_PUBLIC_SANITY_DATASET: 'dataset',
      SANITY_PREVIEW_SECRET: 'secret',
    };
    createClientMock.mockReset();
    cachedClientMock.fetch.mockReset();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  const setup = async () => {
    const standardClient = { fetch: jest.fn() };
    const previewClient = { fetch: jest.fn() };

    createClientMock
      .mockImplementationOnce(() => standardClient)
      .mockImplementationOnce(() => previewClient);

    const mod = await import('../sanity.utils');
    return { ...mod, standardClient, previewClient };
  };

  it('returns clients and validates preview tokens', async () => {
    const { getClient, validatePreviewToken } = await setup();

    expect(validatePreviewToken('secret')).toBe(true);
    expect(validatePreviewToken('nope')).toBe(false);

    expect(getClient()).toHaveProperty('fetch');
    expect(getClient(true)).toHaveProperty('fetch');
  });

  it('fetches by slug using preview or cached client', async () => {
    const { fetchBySlug, previewClient } = await setup();

    previewClient.fetch.mockResolvedValue({ _id: 'preview' });
    cachedClientMock.fetch.mockResolvedValue({ _id: 'cached' });

    await fetchBySlug('listing', 'eco', true);
    expect(previewClient.fetch).toHaveBeenCalled();

    await fetchBySlug('listing', 'eco', false);
    expect(cachedClientMock.fetch).toHaveBeenCalled();
  });
});
