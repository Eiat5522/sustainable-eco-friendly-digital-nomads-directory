import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const fetchMock = jest.fn();
const transformMock = jest.fn();
const trackViewCountMock = jest.fn();

// Mock the sanity client and transformer used by the route
jest.mock('@/lib/sanity/client', () => ({ client: { fetch: (...args: any[]) => fetchMock(...args) } }));
jest.mock('@/lib/dto-transformer', () => ({ transformToBlogDetailDTO: transformMock }));

let GET: any;
let PUT: any;
type RouteContext = { params: Promise<{ slug: string }> };

const parseResponse = async (response: Response) => ({
  status: response.status,
  body: await response.json(),
});

const createPutRequest = (body: unknown, headers: HeadersInit = { 'content-type': 'application/json' }) =>
  new Request('http://localhost/api/blog/test-post', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers,
  });

describe('API /api/blog/[slug] route handlers', () => {
  beforeEach(() => {
    jest.resetModules();
    fetchMock.mockReset();
    transformMock.mockReset();
    trackViewCountMock.mockReset();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ({ GET, PUT } = require('../route'));
  });

  afterEach(() => {
    // module mocks reset per-test via jest.resetAllMocks in the file-level hooks if desired
  });

  describe('GET', () => {
    it('returns transformed blog post data with metadata', async () => {
      const sanityRecord = {
        _id: 'sanity-post-1',
        title: 'Eco Friendly Travel',
        _updatedAt: '2024-02-01T00:00:00.000Z',
      } as const;
      fetchMock.mockResolvedValueOnce(sanityRecord);
      transformMock.mockReturnValueOnce({
        id: 'sanity-post-1',
        title: 'Eco Friendly Travel',
        body: [{ _type: 'block' }, { _type: 'image' }],
        readingTime: 7,
        publishedAt: '2024-01-15T00:00:00.000Z',
        relatedPosts: undefined,
      });

      const response = await GET({} as any, {
        params: Promise.resolve({ slug: 'eco-friendly-travel' }),
      });
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.post).toEqual(
        expect.objectContaining({ id: 'sanity-post-1', title: 'Eco Friendly Travel' })
      );
      expect(body.data.relatedPosts).toEqual([]);
      expect(body.data.meta).toEqual(
        expect.objectContaining({
          readingTime: 7,
          publishedDate: '2024-01-15T00:00:00.000Z',
          lastModified: '2024-02-01T00:00:00.000Z',
          wordCount: 2,
        })
      );
      expect(fetchMock).toHaveBeenCalledWith(expect.anything(), {
        slug: 'eco-friendly-travel',
      });
      expect(transformMock).toHaveBeenCalledWith(sanityRecord);
    });

    it('returns validation error when slug is missing', async () => {
      const response = await GET({} as any, {
        params: Promise.resolve({ slug: '' }),
      });
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body).toEqual({ success: false, error: 'Blog post slug is required' });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns not found when no post exists for slug', async () => {
      fetchMock.mockResolvedValueOnce(null);

      const response = await GET({} as any, {
        params: Promise.resolve({ slug: 'missing-post' }),
      });
      const { status, body } = await parseResponse(response);

      expect(status).toBe(404);
      expect(body).toEqual({ success: false, error: 'Blog post not found' });
    });

    it('returns service unavailable when the CMS fetch fails', async () => {
      fetchMock.mockRejectedValueOnce(new Error('fetch failed: timeout'));

      const response = await GET({} as any, {
        params: Promise.resolve({ slug: 'eco-friendly-travel' }),
      });
      const { status, body } = await parseResponse(response);

      expect(status).toBe(503);
      expect(body).toEqual({
        success: false,
        error: 'Failed to connect to CMS. Please try again later.',
      });
    });

    it('returns bad request when the CMS rejects the slug parameter', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Invalid parameter: slug'));

      const response = await GET({} as any, {
        params: Promise.resolve({ slug: 'bad/slug' }),
      });
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body).toEqual({ success: false, error: 'Invalid blog post slug' });
    });

    it('returns internal server error for unexpected failures', async () => {
      fetchMock.mockResolvedValueOnce({ _id: 'post-1' });
      transformMock.mockImplementationOnce(() => {
        throw new Error('transform failure');
      });

      const response = await GET({} as any, {
        params: Promise.resolve({ slug: 'eco-friendly-travel' }),
      });
      const { status, body } = await parseResponse(response);

      expect(status).toBe(500);
      expect(body).toEqual({ success: false, error: 'Failed to fetch blog post' });
    });
  });

  describe('PUT', () => {
    const context: RouteContext = {
      params: Promise.resolve({ slug: 'eco-friendly-travel' }),
    };

    it('increments the view count for a blog post', async () => {
      fetchMock.mockResolvedValueOnce({ _id: 'post-100', slug: 'eco-friendly-travel' });

      const response = await PUT(
        createPutRequest({ action: 'increment_view' }),
        context
      );
      let payload = await parseResponse(response);

      expect(payload.status).toBe(200);
      expect(payload.body).toEqual({
        success: true,
        data: { viewCount: 1 },
        message: 'View count updated successfully',
      });
      expect(fetchMock).toHaveBeenCalledWith(expect.anything(), {
        slug: 'eco-friendly-travel',
      });

      fetchMock.mockResolvedValueOnce({ _id: 'post-100', slug: 'eco-friendly-travel' });
      const secondResponse = await PUT(
        createPutRequest({ action: 'increment_view' }),
        context
      );
      payload = await parseResponse(secondResponse);
      expect(payload.body.data).toEqual({ viewCount: 2 });
    });

    it('returns not found when the post does not exist', async () => {
      fetchMock.mockResolvedValueOnce(null);

      const response = await PUT(
        createPutRequest({ action: 'increment_view' }),
        context
      );
      const { status, body } = await parseResponse(response);

      expect(status).toBe(404);
      expect(body).toEqual({ success: false, error: 'Blog post not found' });
    });

    it('rejects unsupported actions with a validation error', async () => {
      const response = await PUT(
        createPutRequest({ action: 'unsupported' }),
        context
      );
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body).toEqual({ success: false, error: 'Invalid action' });
    });

    it('returns not found when slug is empty', async () => {
      const response = await PUT(
        createPutRequest({ action: 'increment_view' }),
        { params: Promise.resolve({ slug: '' }) }
      );
      const { status, body } = await parseResponse(response);

      expect(status).toBe(404);
      expect(body).toEqual({ success: false, error: 'Blog post not found' });
    });

    it('returns server error when CMS lookup fails', async () => {
      fetchMock.mockRejectedValueOnce(new Error('fetch failed'));

      const response = await PUT(
        createPutRequest({ action: 'increment_view' }),
        context
      );
      const { status, body } = await parseResponse(response);

      expect(status).toBe(500);
      expect(body).toEqual({ success: false, error: 'Failed to update blog post' });
    });
  });
});
