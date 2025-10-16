import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockSanityFetch = jest.fn();
const mockTransformToBlogDetailDTO = jest.fn();
const successMock = jest.fn();
const errorMock = jest.fn();
const notFoundMock = jest.fn();

let GET: typeof import('../route').GET;
let PUT: typeof import('../route').PUT;

type RouteContext = { params: Promise<{ slug: string }> };

const createSuccessResponse = (data: unknown, message?: string) =>
  new Response(
    JSON.stringify(
      message === undefined
        ? { success: true, data }
        : { success: true, data, message }
    ),
    { status: 200 }
  );

const createErrorResponse = (message: string, status = 400) =>
  new Response(JSON.stringify({ success: false, error: message }), { status });

const createNotFoundResponse = (resource?: string) =>
  new Response(
    JSON.stringify({
      success: false,
      error: resource ? `${resource} not found` : 'Resource not found',
    }),
    { status: 404 }
  );

const loadRouteHandlers = async () => {
  jest.resetModules();
  mockSanityFetch.mockReset();
  mockTransformToBlogDetailDTO.mockReset();
  successMock.mockReset();
  errorMock.mockReset();
  notFoundMock.mockReset();

  successMock.mockImplementation(createSuccessResponse);
  errorMock.mockImplementation(createErrorResponse);
  notFoundMock.mockImplementation(createNotFoundResponse);

  jest.doMock('@/lib/sanity/client', () => ({
    __esModule: true,
    client: { fetch: mockSanityFetch },
  }));

  jest.doMock('@/lib/dto-transformer', () => ({
    __esModule: true,
    transformToBlogDetailDTO: mockTransformToBlogDetailDTO,
  }));

  jest.doMock('@/utils/api-response', () => ({
    __esModule: true,
    ApiResponseHandler: {
      success: successMock,
      error: errorMock,
      notFound: notFoundMock,
    },
  }));

  const mod = await import('../route');
  GET = mod.GET;
  PUT = mod.PUT;
};

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
  beforeEach(async () => {
    await loadRouteHandlers();
  });

  describe('GET', () => {
    it('returns transformed blog post data with metadata', async () => {
      const sanityRecord = {
        _id: 'sanity-post-1',
        title: 'Eco Friendly Travel',
        _updatedAt: '2024-02-01T00:00:00.000Z',
      } as const;
      mockSanityFetch.mockResolvedValueOnce(sanityRecord);
      mockTransformToBlogDetailDTO.mockReturnValueOnce({
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
      expect(mockSanityFetch).toHaveBeenCalledWith(expect.anything(), {
        slug: 'eco-friendly-travel',
      });
      expect(mockTransformToBlogDetailDTO).toHaveBeenCalledWith(sanityRecord);
    });

    it('returns validation error when slug is missing', async () => {
      const response = await GET({} as any, {
        params: Promise.resolve({ slug: '' }),
      });
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body).toEqual({ success: false, error: 'Blog post slug is required' });
      expect(mockSanityFetch).not.toHaveBeenCalled();
    });

    it('returns not found when no post exists for slug', async () => {
      mockSanityFetch.mockResolvedValueOnce(null);

      const response = await GET({} as any, {
        params: Promise.resolve({ slug: 'missing-post' }),
      });
      const { status, body } = await parseResponse(response);

      expect(status).toBe(404);
      expect(body).toEqual({ success: false, error: 'Blog post not found' });
      expect(notFoundMock).toHaveBeenCalledWith('Blog post');
    });

    it('returns service unavailable when the CMS fetch fails', async () => {
      mockSanityFetch.mockRejectedValueOnce(new Error('fetch failed: timeout'));

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
      mockSanityFetch.mockRejectedValueOnce(new Error('Invalid parameter: slug'));

      const response = await GET({} as any, {
        params: Promise.resolve({ slug: 'bad/slug' }),
      });
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body).toEqual({ success: false, error: 'Invalid blog post slug' });
    });

    it('returns internal server error for unexpected failures', async () => {
      mockSanityFetch.mockResolvedValueOnce({ _id: 'post-1' });
      mockTransformToBlogDetailDTO.mockImplementationOnce(() => {
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
      mockSanityFetch.mockResolvedValueOnce({ _id: 'post-100', slug: 'eco-friendly-travel' });

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
      expect(mockSanityFetch).toHaveBeenCalledWith(expect.anything(), {
        slug: 'eco-friendly-travel',
      });

      mockSanityFetch.mockResolvedValueOnce({ _id: 'post-100', slug: 'eco-friendly-travel' });
      const secondResponse = await PUT(
        createPutRequest({ action: 'increment_view' }),
        context
      );
      payload = await parseResponse(secondResponse);
      expect(payload.body.data).toEqual({ viewCount: 2 });
    });

    it('returns not found when the post does not exist', async () => {
      mockSanityFetch.mockResolvedValueOnce(null);

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
      mockSanityFetch.mockRejectedValueOnce(new Error('fetch failed'));

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
