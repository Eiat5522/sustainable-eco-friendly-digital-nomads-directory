import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockGetListingBySlug = jest.fn();
const mockRequireAuth = jest.fn();
const mockHandleAuthError = jest.fn();
const mockGetCollection = jest.fn();

let GET: typeof import('./route').GET;
let PUT: typeof import('./route').PUT;
let DELETE: typeof import('./route').DELETE;

const loadHandlers = async () => {
  jest.resetModules();
  mockGetListingBySlug.mockReset();
  mockRequireAuth.mockReset();
  mockHandleAuthError.mockReset();
  mockGetCollection.mockReset();

  jest.doMock('@/lib/sanity/queries', () => ({
    __esModule: true,
    getListingBySlug: mockGetListingBySlug,
  }));

  jest.doMock('@/utils/auth-helpers', () => ({
    __esModule: true,
    requireAuth: mockRequireAuth,
    handleAuthError: mockHandleAuthError,
  }));

  jest.doMock('@/utils/db-helpers', () => ({
    __esModule: true,
    getCollection: mockGetCollection,
  }));

  const mod = await import('./route');
  GET = mod.GET;
  PUT = mod.PUT;
  DELETE = mod.DELETE;
};

import { ApiResponseHandler } from '@/utils/api-response';

type RouteContext = { params: Promise<{ slug: string }> };

describe('API /api/listings/[slug] route handlers', () => {
  const context: RouteContext = { params: Promise.resolve({ slug: 'test-listing' }) };

  const parseResponse = async (response: Response) => ({
    status: response.status,
    body: await response.json(),
  });

  beforeEach(async () => {
    await loadHandlers();
  });

  describe('GET', () => {
    it('returns listing data when found', async () => {
      mockGetListingBySlug.mockResolvedValueOnce({ _id: 'listing-1', name: 'Eco Hub' } as any);

      const response = await GET(
        new Request('http://localhost/api/listings/test-listing'),
        context
      );
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body).toEqual({ success: true, data: { _id: 'listing-1', name: 'Eco Hub' } });
      expect(mockGetListingBySlug).toHaveBeenCalledWith('test-listing');
    });

    it('returns not found when listing is missing', async () => {
      mockGetListingBySlug.mockResolvedValueOnce(null);

      const response = await GET(
        new Request('http://localhost/api/listings/test-listing'),
        context
      );
      const { status, body } = await parseResponse(response);

      expect(status).toBe(404);
      expect(body).toEqual({ success: false, error: 'Listing not found' });
    });

    it('returns server error when fetching fails', async () => {
      mockGetListingBySlug.mockRejectedValueOnce(new Error('sanity failure'));

      const response = await GET(
        new Request('http://localhost/api/listings/test-listing'),
        context
      );
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body).toEqual({ success: false, error: 'Failed to fetch listing' });
    });
  });

  describe('PUT', () => {
    const createRequest = (body: unknown) =>
      new Request('http://localhost/api/listings/test-listing', {
        method: 'PUT',
        body: JSON.stringify(body),
        headers: { 'content-type': 'application/json' },
      });

    it('updates listing when user is the owner', async () => {
      mockRequireAuth.mockResolvedValueOnce({ user: { id: 'owner-1' } } as any);
      const updateOne = jest.fn().mockResolvedValue({ acknowledged: true, modifiedCount: 1 });
      mockGetCollection.mockResolvedValueOnce({
        findOne: jest.fn().mockResolvedValue({ slug: 'test-listing', ownerId: 'owner-1' }),
        updateOne,
      });

      const response = await PUT(createRequest({ title: 'Updated title' }), context);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Listing updated successfully');
      expect(body.data).toMatchObject({ title: 'Updated title' });
      expect(new Date(body.data.updatedAt).toString()).not.toBe('Invalid Date');
      expect(updateOne).toHaveBeenCalledWith(
        { slug: 'test-listing' },
        { $set: expect.objectContaining({ title: 'Updated title' }) }
      );
    });

    it('returns not found when listing does not exist', async () => {
      mockRequireAuth.mockResolvedValueOnce({ user: { id: 'owner-1' } } as any);
      mockGetCollection.mockResolvedValueOnce({
        findOne: jest.fn().mockResolvedValue(null),
      });

      const response = await PUT(createRequest({ title: 'Updated title' }), context);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(404);
      expect(body).toEqual({ success: false, error: 'Listing not found' });
    });

    it('returns forbidden when user is not the owner', async () => {
      mockRequireAuth.mockResolvedValueOnce({ user: { id: 'other-user' } } as any);
      mockGetCollection.mockResolvedValueOnce({
        findOne: jest.fn().mockResolvedValue({ slug: 'test-listing', ownerId: 'owner-1' }),
      });

      const response = await PUT(createRequest({ title: 'Updated title' }), context);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(403);
      expect(body).toEqual({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to update this listing',
      });
    });

    it('delegates to handleAuthError when requireAuth throws', async () => {
      const expectedResponse = ApiResponseHandler.unauthorized();
      mockRequireAuth.mockRejectedValueOnce(new Error('UNAUTHORIZED'));
      mockHandleAuthError.mockReturnValueOnce(expectedResponse);

      const response = await PUT(createRequest({ title: 'Updated title' }), context);

      expect(response).toBe(expectedResponse);
      expect(mockHandleAuthError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('DELETE', () => {
    const request = new Request('http://localhost/api/listings/test-listing', { method: 'DELETE' });

    it('marks listing as deleted when user is owner', async () => {
      mockRequireAuth.mockResolvedValueOnce({ user: { id: 'owner-1' } } as any);
      const updateOne = jest.fn().mockResolvedValue({ acknowledged: true, modifiedCount: 1 });
      mockGetCollection.mockResolvedValueOnce({
        findOne: jest.fn().mockResolvedValue({ slug: 'test-listing', ownerId: 'owner-1' }),
        updateOne,
      });

      const response = await DELETE(request, context);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body).toEqual({ success: true, data: null, message: 'Listing deleted successfully' });
      expect(updateOne).toHaveBeenCalledWith(
        { slug: 'test-listing' },
        { $set: { status: 'deleted', deletedAt: expect.any(Date) } }
      );
    });

    it('returns not found when listing does not exist', async () => {
      mockRequireAuth.mockResolvedValueOnce({ user: { id: 'owner-1' } } as any);
      mockGetCollection.mockResolvedValueOnce({
        findOne: jest.fn().mockResolvedValue(null),
      });

      const response = await DELETE(request, context);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(404);
      expect(body).toEqual({ success: false, error: 'Listing not found' });
    });

    it('returns forbidden when user is not the owner', async () => {
      mockRequireAuth.mockResolvedValueOnce({ user: { id: 'other-user' } } as any);
      mockGetCollection.mockResolvedValueOnce({
        findOne: jest.fn().mockResolvedValue({ slug: 'test-listing', ownerId: 'owner-1' }),
      });

      const response = await DELETE(request, context);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(403);
      expect(body).toEqual({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to delete this listing',
      });
    });

    it('delegates to handleAuthError when requireAuth throws', async () => {
      const expectedResponse = ApiResponseHandler.unauthorized();
      mockRequireAuth.mockRejectedValueOnce(new Error('UNAUTHORIZED'));
      mockHandleAuthError.mockReturnValueOnce(expectedResponse);

      const response = await DELETE(request, context);

      expect(response).toBe(expectedResponse);
      expect(mockHandleAuthError).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
