const standardClient = { fetch: jest.fn() };
const previewClient = { fetch: jest.fn() };
const createClientMock = jest.fn();
const cachedFetchMock = jest.fn();

jest.mock('next-sanity', () => ({
  createClient: createClientMock,
}));

jest.mock('../sanity/cached-client', () => ({
  cachedClient: {
    fetch: cachedFetchMock,
  },
}));

describe('sanity utils', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'proj';
    process.env.NEXT_PUBLIC_SANITY_DATASET = 'dataset';
    process.env.SANITY_PREVIEW_SECRET = 'secret';
    standardClient.fetch.mockReset();
    previewClient.fetch.mockReset();
    createClientMock.mockReset();
    cachedFetchMock.mockReset();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const loadModule = async () => {
    createClientMock.mockImplementation((options: Record<string, unknown>) => {
      if (options?.perspective === 'previewDrafts') {
        return previewClient;
      }
      return standardClient;
    });

    return import('../sanity.utils');
  };

  it('creates clients with expected configuration and exports helpers', async () => {
    process.env.NODE_ENV = 'production';
    const mod = await loadModule();
    // Trigger the client initialization explicitly to reflect lazy-loading
    mod.getClient();
    mod.getClient(true);

    expect(createClientMock).toHaveBeenNthCalledWith(1, {
      projectId: 'proj',
      dataset: 'dataset',
      apiVersion: '2025-05-15',
      useCdn: true,
    });
    expect(createClientMock).toHaveBeenNthCalledWith(2, {
      projectId: 'proj',
      dataset: 'dataset',
      apiVersion: '2025-05-15',
      useCdn: false,
      perspective: 'previewDrafts',
    });

    expect(mod.getClient()).toBe(standardClient);
    expect(mod.getClient(true)).toBe(previewClient);
    expect(mod.config).toEqual({
      dataset: 'dataset',
      projectId: 'proj',
      apiVersion: '2025-05-15',
      useCdn: true,
    });
  });

  it('validates preview tokens against the configured secret', async () => {
    const mod = await loadModule();

    expect(mod.validatePreviewToken('secret')).toBe(true);
    expect(mod.validatePreviewToken('nope')).toBe(false);
  });

  it('fetches preview data using the preview client', async () => {
    const mod = await loadModule();
    mod.getClient(true); // Ensure preview client is initialized
    previewClient.fetch.mockResolvedValueOnce({ slug: 'preview' });

    const result = await mod.fetchBySlug('post', 'hello', true);

    expect(previewClient.fetch).toHaveBeenCalledWith(expect.any(String), {
      type: 'post',
      slug: 'hello',
    });
    expect(result).toEqual({ slug: 'preview' });
  });

  it('fetches cached data when not in preview mode', async () => {
    const mod = await loadModule();
    cachedFetchMock.mockResolvedValueOnce({ slug: 'cached' });

    const result = await mod.fetchBySlug('post', 'hello');

    expect(cachedFetchMock).toHaveBeenCalledWith(expect.any(String), {
      type: 'post',
      slug: 'hello',
    });
    expect(result).toEqual({ slug: 'cached' });
  });
});
