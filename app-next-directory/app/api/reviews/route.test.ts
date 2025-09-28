import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GET } from './route';

describe('API /api/reviews GET', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Simplified mock setup
  function createMockCollection(docs: any[] = [], totalCount?: number) {
    const mockCursor = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue(docs),
    };

    return {
      find: jest.fn().mockReturnValue(mockCursor),
      countDocuments: jest.fn().mockResolvedValue(totalCount ?? docs.length),
      _mockCursor: mockCursor, // Expose for assertions
    };
  }

  it('returns reviews with pagination defaulting to page=1, limit=10 and applies DB params', async () => {
    const mockCollection = createMockCollection([
      { _id: 'r1', verified: true, helpfulCount: 2 },
      { _id: 'r2', verified: false, helpfulCount: 0 },
    ]);

    const req = new Request('http://localhost/api/reviews');
    const res = await GET(req, { collection: mockCollection } as any);
    
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data.reviews)).toBe(true);
    expect(json.data.pagination.page).toBe(1);
    expect(json.data.pagination.limit).toBe(10);

    // Verify DB query parameters
    expect(mockCollection.find).toHaveBeenCalledWith({ status: 'approved' });
    expect(mockCollection._mockCursor.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(mockCollection._mockCursor.skip).toHaveBeenCalledWith(0);
    expect(mockCollection._mockCursor.limit).toHaveBeenCalledWith(10);
  });

  it('supports filtering by listing and sorting by helpful, and sets isHelpful correctly', async () => {
    const mockCollection = createMockCollection([{ _id: 'r1', verified: true, helpfulCount: 5 }]);
    const req = new Request('http://localhost/api/reviews?listing=slug-1&sortBy=helpful');
    const res = await GET(req, { collection: mockCollection } as any);
    
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.reviews[0]).toHaveProperty('isHelpful', true);

    expect(mockCollection.find).toHaveBeenCalledWith({ status: 'approved', listingSlug: 'slug-1' });
    expect(mockCollection._mockCursor.sort).toHaveBeenCalledWith({ helpfulCount: -1 });
  });

  it('sets isHelpful false when helpfulCount is 0 or missing', async () => {
    const mockCollection = createMockCollection([
      { _id: 'r1', verified: true, helpfulCount: 0 },
      { _id: 'r2', verified: true },
    ]);
    const req = new Request('http://localhost/api/reviews');
    const res = await GET(req, { collection: mockCollection } as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.reviews[0].isHelpful).toBe(false);
    expect(json.data.reviews[1].isHelpful).toBe(false);
  });

  it('returns empty list and correct pagination when no results', async () => {
    const mockCollection = createMockCollection([], 0);
    const req = new Request('http://localhost/api/reviews?page=2&limit=10');
    const res = await GET(req, { collection: mockCollection } as any);
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
    // Create a mock that throws an error
    const badCollection = {
      find: jest.fn().mockImplementation(() => { throw new Error('DB down'); }),
      countDocuments: jest.fn(),
    };
    
    const req = new Request('http://localhost/api/reviews');
    const res = await GET(req, { collection: badCollection } as any);
    
    // The most important thing is that it returns a 500 status code
    expect(res.status).toBe(500);
    
    // Verify the mock was called (error was triggered)
    expect(badCollection.find).toHaveBeenCalled();
  });
});
