import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GET } from './route';

describe('API /api/reviews GET', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  function setupRouteWithMock(docs: any[], totalCount?: number) {
    const cursor: any = {};
    cursor.sort = jest.fn().mockReturnValue(cursor);
    cursor.skip = jest.fn().mockReturnValue(cursor);
    cursor.limit = jest.fn().mockReturnValue(cursor);
    cursor.toArray = async () => docs as any[];

    const collection: any = {
      find: jest.fn().mockReturnValue(cursor),
      countDocuments: async () => (totalCount ?? docs.length),
    };

    return { cursor, collection };
  }

  it('returns reviews with pagination defaulting to page=1, limit=10 and applies DB params', async () => {
    const { cursor, collection } = setupRouteWithMock([
      { _id: 'r1', verified: true, helpfulCount: 2 },
      { _id: 'r2', verified: false, helpfulCount: 0 },
    ]);

    const req = new Request('http://localhost/api/reviews');
    const res = await GET(req, { collection } as any);
    // Ensure our mock was used
    expect(typeof collection.find).toBe('function');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data.reviews)).toBe(true);
    expect(json.data.pagination.page).toBe(1);
    expect(json.data.pagination.limit).toBe(10);

    // Verify DB query parameters
    expect(collection.find).toHaveBeenCalledWith({ status: 'approved' });
    expect(cursor.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(cursor.skip).toHaveBeenCalledWith(0);
    expect(cursor.limit).toHaveBeenCalledWith(10);
  });

  it('supports filtering by listing and sorting by helpful, and sets isHelpful correctly', async () => {
    const { cursor, collection } = setupRouteWithMock([{ _id: 'r1', verified: true, helpfulCount: 5 }]);
    const req = new Request('http://localhost/api/reviews?listing=slug-1&sortBy=helpful');
    const res = await GET(req, { collection } as any);
    // Ensure our mock was used
    expect(typeof collection.find).toBe('function');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.reviews[0]).toHaveProperty('isHelpful', true);

    expect(collection.find).toHaveBeenCalledWith({ status: 'approved', listingSlug: 'slug-1' });
    expect(cursor.sort).toHaveBeenCalledWith({ helpfulCount: -1 });
  });

  it('sets isHelpful false when helpfulCount is 0 or missing', async () => {
    const { collection } = setupRouteWithMock([
      { _id: 'r1', verified: true, helpfulCount: 0 },
      { _id: 'r2', verified: true },
    ]);
    const req = new Request('http://localhost/api/reviews');
    const res = await GET(req, { collection } as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.reviews[0].isHelpful).toBe(false);
    expect(json.data.reviews[1].isHelpful).toBe(false);
  });

  it('returns empty list and correct pagination when no results', async () => {
    const { collection } = setupRouteWithMock([], 0);
    const req = new Request('http://localhost/api/reviews?page=2&limit=10');
    const res = await GET(req, { collection } as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.reviews).toEqual([]);
    expect(json.data.pagination).toMatchObject({
      page: 2,
      limit: 10,
      total: 0,
      pages: 0,
      hasNext: false,
      hasPrev: true,
    });
  });

  it('handles internal errors with 500', async () => {
    // Inject a collection that throws to simulate DB failure
    const badCollection: any = {
      find: () => { throw new Error('DB down'); },
      countDocuments: jest.fn(),
    };
    const req = new Request('http://localhost/api/reviews');
    const res = await GET(req, { collection: badCollection } as any);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBeDefined();
  });
});
