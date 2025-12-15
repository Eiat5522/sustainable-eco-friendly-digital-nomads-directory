import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockedGetFeaturedListings = jest.fn();

let GET: typeof import('./route').GET;
let getFeaturedListingsSpy: typeof mockedGetFeaturedListings;

const loadModule = async () => {
  jest.resetModules();
  mockedGetFeaturedListings.mockReset();
  jest.doMock('@/lib/sanity/queries', () => ({
    __esModule: true,
    getFeaturedListings: mockedGetFeaturedListings,
  }));

  const mod = await import('./route');
  GET = mod.GET;
};

const parseResponse = async (response: Response) => ({
  status: response.status,
  body: await response.json(),
});

describe('API /api/listings/featured route handler', () => {
  beforeEach(async () => {
    await loadModule();
    getFeaturedListingsSpy = mockedGetFeaturedListings;
  });

  afterEach(() => {
    mockedGetFeaturedListings.mockReset();
  });

  it('returns limited number of featured listings when request provides a limit', async () => {
    getFeaturedListingsSpy.mockResolvedValueOnce([{ _id: 'a' }, { _id: 'b' }, { _id: 'c' }] as unknown);

    const response = await GET(new Request('http://localhost/api/listings/featured?limit=2'));
    const { status, body } = await parseResponse(response);

    expect(status).toBe(200);
    expect(body).toEqual({ success: true, data: [{ _id: 'a' }, { _id: 'b' }] });
    expect(getFeaturedListingsSpy).toHaveBeenCalledTimes(1);
  });

  it('uses default limit when query parameter is missing', async () => {
    getFeaturedListingsSpy.mockResolvedValueOnce(
      Array.from({ length: 10 }, (_, index) => ({ _id: `id-${index}` })) as unknown
    );

    const response = await GET(new Request('http://localhost/api/listings/featured'));
    const { status, body } = await parseResponse(response);

    expect(status).toBe(200);
    expect(body.data).toHaveLength(4);
    expect(getFeaturedListingsSpy).toHaveBeenCalledWith();
  });

  it('returns error when fetching featured listings fails', async () => {
    getFeaturedListingsSpy.mockRejectedValueOnce(new Error('sanity failure'));

    const response = await GET(new Request('http://localhost/api/listings/featured?limit=3'));
    const { status, body } = await parseResponse(response);

    expect(status).toBe(400);
    expect(body).toEqual({ success: false, error: 'Failed to fetch featured listings' });
  });
});
