/**
 * @jest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { getPostsCached } from '../data';

const validPagination = {
  page: 1,
  limit: 10,
  totalCount: 10,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
  nextPage: null,
  prevPage: null,
};

const validPost = {
  id: 'post-1',
  title: 'Test Post',
  slug: 'test-post',
  excerpt: null,
  tags: ['eco'],
  imageUrl: null,
};

const mockResponse = (payload: unknown): Response =>
  ({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: jest.fn().mockResolvedValue(payload),
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    clone: jest.fn(),
    text: jest.fn().mockResolvedValue(JSON.stringify(payload)),
  }) as unknown as Response;

describe('getPostsCached runtime validation', () => {
  const originalFetch = globalThis.fetch;
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    fetchMock = jest.fn();
    globalThis.fetch = fetchMock as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('rejects when posts payload is invalid', async () => {
    fetchMock.mockResolvedValue(
      mockResponse({
        success: true,
        data: {
          posts: [{ title: 'Missing id', slug: 'missing-id' }],
          pagination: validPagination,
          uniqueTags: [],
        },
      })
    );

    await expect(getPostsCached({ baseUrl: 'https://example.com' })).rejects.toThrow(
      'Blog API returned invalid posts payload'
    );
  });

  it('rejects when pagination payload is invalid', async () => {
    fetchMock.mockResolvedValue(
      mockResponse({
        success: true,
        data: {
          posts: [validPost],
          pagination: { ...validPagination, page: '1' },
          uniqueTags: ['eco'],
        },
      })
    );

    await expect(getPostsCached({ baseUrl: 'https://example.com' })).rejects.toThrow(
      'Blog API returned invalid pagination payload'
    );
  });

  it('resolves when payload is valid', async () => {
    fetchMock.mockResolvedValue(
      mockResponse({
        success: true,
        data: {
          posts: [validPost],
          pagination: validPagination,
          uniqueTags: ['eco'],
        },
      })
    );

    const result = await getPostsCached({ baseUrl: 'https://example.com' });
    expect(result.posts).toHaveLength(1);
    expect(result.posts[0].id).toBe('post-1');
  });
});
