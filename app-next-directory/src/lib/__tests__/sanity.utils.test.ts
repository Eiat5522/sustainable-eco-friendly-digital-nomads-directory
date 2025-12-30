const standardClient = { fetch: jest.fn() };
const previewClient = { fetch: jest.fn() };
const cachedFetchMock = jest.fn();
const getClientMock = jest.fn();

jest.mock('../sanity/client', () => ({
  client: standardClient,
  previewClient,
  getClient: getClientMock,
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
    cachedFetchMock.mockReset();
    getClientMock.mockReset();
    getClientMock.mockImplementation(preview => (preview ? previewClient : standardClient));
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const loadModule = () => import('../sanity.utils');

  it('re-exports the shared client helpers and config', async () => {
    const mod = await loadModule();

    expect(mod.getClient()).toBe(standardClient);
    expect(getClientMock).toHaveBeenCalledWith(undefined);
    expect(mod.getClient(true)).toBe(previewClient);
    expect(getClientMock).toHaveBeenLastCalledWith(true);
    expect(mod.config).toEqual({
      dataset: 'dataset',
      projectId: 'proj',
      apiVersion: '2025-05-15',
      useCdn: false,
    });
  });

  it('validates preview tokens against the configured secret', async () => {
    const mod = await loadModule();

    expect(mod.validatePreviewToken('secret')).toBe(true);
    expect(mod.validatePreviewToken('nope')).toBe(false);
  });

  it('fetches preview data using the preview client', async () => {
    const mod = await loadModule();
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
