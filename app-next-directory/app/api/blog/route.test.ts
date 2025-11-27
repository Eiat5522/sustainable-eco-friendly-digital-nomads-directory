import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

const fetchMock = jest.fn<any, any[]>();
const transformMock = jest.fn((post: any) => ({ id: post._id, title: post.title }));

jest.mock('@/lib/sanity/client', () => ({
  client: jest.fn(() => ({ fetch: (...args: any[]) => fetchMock(...args) })),
}));
jest.mock('@/lib/dto-transformer', () => ({
  transformToBlogSummaryDTO: (...args: any[]) => transformMock(...args),
}));

let GET: typeof import('./route').GET;

beforeAll(async () => {
  ({ GET } = await import('./route'));
});

describe('Blog API - GET /api/blog', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    transformMock.mockClear();
  });

  it('returns paginated blog posts', async () => {
    const mockPosts = [
      {
        _id: '1',
        title: 'Test Post 1',
        publishedAt: '2024-01-01',
        slug: { current: 'test-post-1' },
      },
      {
        _id: '2',
        title: 'Test Post 2',
        publishedAt: '2024-01-02',
        slug: { current: 'test-post-2' },
      },
    ];
    fetchMock.mockResolvedValueOnce(mockPosts).mockResolvedValueOnce(2);

    const request = new Request('http://localhost/api/blog?page=1&limit=2');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.posts.length).toBe(2);
    expect(data.data.pagination.totalCount).toBe(2);
    expect(data.data.pagination.page).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(transformMock).toHaveBeenCalledTimes(2);
  });

  it('returns an empty array when no posts exist', async () => {
    fetchMock.mockResolvedValueOnce([]).mockResolvedValueOnce(0);

    const request = new Request('http://localhost/api/blog');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.posts).toEqual([]);
    expect(data.data.pagination.totalCount).toBe(0);
  });

  it('returns 500 on fetch failure', async () => {
    fetchMock.mockRejectedValue(new Error('DB Error'));

    const request = new Request('http://localhost/api/blog');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch blog posts');
  });

  it('builds correct GROQ queries based on query params', async () => {
    fetchMock.mockResolvedValueOnce([]).mockResolvedValueOnce(0);

    await GET(new Request('http://localhost/api/blog'));
    const postsQuery = fetchMock.mock.calls[0][0] as string;
    const countQuery = fetchMock.mock.calls[1][0] as string;

    expect(postsQuery).toContain('_type == "blogPost"');
    expect(postsQuery).toContain('order(publishedAt desc)');
    expect(countQuery).toContain('count(*[_type == "blogPost" && defined(slug)])');

    // tag filter
    fetchMock.mockReset();
    fetchMock.mockResolvedValueOnce([]).mockResolvedValueOnce(0);
    await GET(new Request('http://localhost/api/blog?tag=tech'));
    expect(fetchMock.mock.calls[0][0]).toContain('"tech" in tags');

    // search filter
    fetchMock.mockReset();
    fetchMock.mockResolvedValueOnce([]).mockResolvedValueOnce(0);
    await GET(new Request('http://localhost/api/blog?search=Next.js'));
    expect(fetchMock.mock.calls[0][0]).toContain('title match "*Next.js*"');
  });
});
