import { describe, it, expect, beforeEach, beforeAll, jest } from '@jest/globals';

jest.mock('@/utils/db-helpers', () => ({ __esModule: true, getCollection: jest.fn() }));
jest.mock('@/utils/api-response', () => ({
  __esModule: true,
  ApiResponseHandler: {
    error: jest.fn((message: string) => 
      new Response(JSON.stringify({ error: message }), { status: 500 })
    ),
    success: jest.fn((data: unknown) => 
      new Response(JSON.stringify({ success: true, data }), { status: 200 })
    ),
  },
}));

import { getCollection } from '@/utils/db-helpers';

const dbHelpersMock = jest.requireMock('@/utils/db-helpers') as { getCollection: jest.Mock };
const mockGetCollection = dbHelpersMock.getCollection;

let GET: typeof import('./route').GET;

describe('API /api/reviews/listing/[slug]', () => {
  beforeAll(async () => {
    ({ GET } = await import('./route'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createMockCollection(reviews: any[] = [], totalCount?: number) {
    const mockCursor = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue(reviews),
    };

    return {
      find: jest.fn().mockReturnValue(mockCursor),
      countDocuments: jest.fn().mockResolvedValue(totalCount ?? reviews.length),
      _mockCursor: mockCursor,
    };
  }

  it('returns reviews for a specific listing slug with default pagination', async () => {
    const mockReviews = [
      {
        _id: 'review1',
        listingSlug: 'eco-lodge-bali',
        rating: 5,
        comment: 'Amazing place!',
        status: 'approved',
        createdAt: new Date('2024-01-15'),
      },
      {
        _id: 'review2',
        listingSlug: 'eco-lodge-bali',
        rating: 4,
        comment: 'Very good experience',
        status: 'approved',
        createdAt: new Date('2024-01-14'),
      },
    ];
    const mockCollection = createMockCollection(mockReviews, 2);
    
    mockGetCollection.mockResolvedValue(mockCollection);

    const req = new Request('http://localhost/api/reviews/listing/eco-lodge-bali');
    const res = await GET(req, { params: Promise.resolve({ slug: 'eco-lodge-bali' }) });
    
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.reviews).toHaveLength(2);
    expect(json.data.reviews[0]._id).toBe('review1');
    expect(json.data.pagination).toMatchObject({
      page: 1,
      limit: 10,
      total: 2,
      pages: 1,
    });

    // Verify DB query
    expect(mockCollection.find).toHaveBeenCalledWith({
      listingSlug: 'eco-lodge-bali',
      status: 'approved',
    });
    expect(mockCollection._mockCursor.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(mockCollection._mockCursor.skip).toHaveBeenCalledWith(0);
    expect(mockCollection._mockCursor.limit).toHaveBeenCalledWith(10);
  });

  it('supports custom page parameter', async () => {
    const mockCollection = createMockCollection(
      [{ _id: 'review11', listingSlug: 'eco-lodge-bali' }],
      25
    );
    
    mockGetCollection.mockResolvedValue(mockCollection);

    const req = new Request('http://localhost/api/reviews/listing/eco-lodge-bali?page=2');
    const res = await GET(req, { params: Promise.resolve({ slug: 'eco-lodge-bali' }) });
    
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.pagination.page).toBe(2);
    expect(mockCollection._mockCursor.skip).toHaveBeenCalledWith(10);
  });

  it('supports custom limit parameter', async () => {
    const mockReviews = Array.from({ length: 5 }, (_, i) => ({
      _id: `review${i}`,
      listingSlug: 'eco-lodge-bali',
    }));
    const mockCollection = createMockCollection(mockReviews, 50);
    
    mockGetCollection.mockResolvedValue(mockCollection);

    const req = new Request('http://localhost/api/reviews/listing/eco-lodge-bali?limit=5');
    const res = await GET(req, { params: Promise.resolve({ slug: 'eco-lodge-bali' }) });
    
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.pagination.limit).toBe(5);
    expect(json.data.reviews).toHaveLength(5);
    expect(mockCollection._mockCursor.limit).toHaveBeenCalledWith(5);
  });

  it('supports both page and limit parameters', async () => {
    const mockCollection = createMockCollection(
      [{ _id: 'review31', listingSlug: 'eco-lodge-bali' }],
      100
    );
    
    mockGetCollection.mockResolvedValue(mockCollection);

    const req = new Request('http://localhost/api/reviews/listing/eco-lodge-bali?page=3&limit=20');
    const res = await GET(req, { params: Promise.resolve({ slug: 'eco-lodge-bali' }) });
    
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.pagination).toMatchObject({
      page: 3,
      limit: 20,
      total: 100,
      pages: 5,
    });
    expect(mockCollection._mockCursor.skip).toHaveBeenCalledWith(40); // (3-1) * 20
    expect(mockCollection._mockCursor.limit).toHaveBeenCalledWith(20);
  });

  it('returns empty array when no reviews found for slug', async () => {
    const mockCollection = createMockCollection([], 0);
    
    mockGetCollection.mockResolvedValue(mockCollection);

    const req = new Request('http://localhost/api/reviews/listing/non-existent-slug');
    const res = await GET(req, { params: Promise.resolve({ slug: 'non-existent-slug' }) });
    
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.reviews).toEqual([]);
    expect(json.data.pagination).toMatchObject({
      page: 1,
      limit: 10,
      total: 0,
      pages: 0,
    });
  });

  it('only returns approved reviews', async () => {
    const mockCollection = createMockCollection([
      { _id: 'review1', status: 'approved' },
      { _id: 'review2', status: 'approved' },
    ]);
    
    mockGetCollection.mockResolvedValue(mockCollection);

    const req = new Request('http://localhost/api/reviews/listing/eco-lodge-bali');
    const res = await GET(req, { params: Promise.resolve({ slug: 'eco-lodge-bali' }) });
    
    expect(res.status).toBe(200);
    expect(mockCollection.find).toHaveBeenCalledWith({
      listingSlug: 'eco-lodge-bali',
      status: 'approved',
    });
  });

  it('sorts reviews by createdAt in descending order', async () => {
    const mockCollection = createMockCollection([
      { _id: 'review1', createdAt: new Date('2024-01-15') },
      { _id: 'review2', createdAt: new Date('2024-01-14') },
    ]);
    
    mockGetCollection.mockResolvedValue(mockCollection);

    const req = new Request('http://localhost/api/reviews/listing/eco-lodge-bali');
    await GET(req, { params: Promise.resolve({ slug: 'eco-lodge-bali' }) });
    
    expect(mockCollection._mockCursor.sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it('calculates pagination pages correctly', async () => {
    const mockCollection = createMockCollection([], 45);
    
    mockGetCollection.mockResolvedValue(mockCollection);

    const req = new Request('http://localhost/api/reviews/listing/eco-lodge-bali?limit=10');
    const res = await GET(req, { params: Promise.resolve({ slug: 'eco-lodge-bali' }) });
    
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.pagination.pages).toBe(5); // Math.ceil(45 / 10) = 5
  });

  it('handles slug with special characters', async () => {
    const mockCollection = createMockCollection([
      { _id: 'review1', listingSlug: 'eco-lodge-bali-2024' },
    ]);
    
    mockGetCollection.mockResolvedValue(mockCollection);

    const req = new Request('http://localhost/api/reviews/listing/eco-lodge-bali-2024');
    const res = await GET(req, { params: Promise.resolve({ slug: 'eco-lodge-bali-2024' }) });
    
    expect(res.status).toBe(200);
    expect(mockCollection.find).toHaveBeenCalledWith({
      listingSlug: 'eco-lodge-bali-2024',
      status: 'approved',
    });
  });



  it('handles database errors gracefully', async () => {
    mockGetCollection.mockRejectedValue(new Error('Database connection failed'));

    const req = new Request('http://localhost/api/reviews/listing/eco-lodge-bali');
    const res = await GET(req, { params: Promise.resolve({ slug: 'eco-lodge-bali' }) });
    
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Failed to fetch listing reviews');
  });

  it('handles errors during toArray gracefully', async () => {
    const mockCursor = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockRejectedValue(new Error('Query execution failed')),
    };
    
    const mockCollection = {
      find: jest.fn().mockReturnValue(mockCursor),
      countDocuments: jest.fn().mockResolvedValue(10),
    };
    
    mockGetCollection.mockResolvedValue(mockCollection);

    const req = new Request('http://localhost/api/reviews/listing/eco-lodge-bali');
    const res = await GET(req, { params: Promise.resolve({ slug: 'eco-lodge-bali' }) });
    
    expect(res.status).toBe(500);
  });

  it('returns correct data structure with all expected fields', async () => {
    const mockReviews = [
      {
        _id: 'review1',
        listingSlug: 'eco-lodge-bali',
        rating: 5,
        comment: 'Great!',
        status: 'approved',
        createdAt: new Date('2024-01-15'),
        userName: 'John Doe',
        helpful: 10,
      },
    ];
    const mockCollection = createMockCollection(mockReviews, 1);
    
    mockGetCollection.mockResolvedValue(mockCollection);

    const req = new Request('http://localhost/api/reviews/listing/eco-lodge-bali');
    const res = await GET(req, { params: Promise.resolve({ slug: 'eco-lodge-bali' }) });
    
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('success', true);
    expect(json).toHaveProperty('data');
    expect(json.data).toHaveProperty('reviews');
    expect(json.data).toHaveProperty('pagination');
    expect(json.data.reviews[0]).toMatchObject({
      _id: 'review1',
      listingSlug: 'eco-lodge-bali',
      rating: 5,
      comment: 'Great!',
    });
  });
});
