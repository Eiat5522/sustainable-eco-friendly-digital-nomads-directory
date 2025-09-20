import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('@/utils/db-helpers', () => ({
  getCollection: jest.fn(),
}));

import { GET } from './route';
import { getCollection } from '@/utils/db-helpers';

describe('API /api/reviews GET', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  function mockReviewsCollection(docs: any[]) {
    const cursor = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue(docs),
    };
    (getCollection as jest.Mock).mockResolvedValue({
      find: jest.fn().mockReturnValue(cursor),
      countDocuments: jest.fn().mockResolvedValue(docs.length),
    });
  }

  it('returns reviews with pagination defaulting to page=1, limit=10', async () => {
    mockReviewsCollection([
      { _id: 'r1', verified: true, helpfulCount: 2 },
      { _id: 'r2', verified: false, helpfulCount: 0 },
    ]);

    const req = new Request('http://localhost/api/reviews');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data.reviews)).toBe(true);
    expect(json.data.pagination.page).toBe(1);
    expect(json.data.pagination.limit).toBe(10);
  });

  it('supports filtering by listing and sorting by helpful', async () => {
    mockReviewsCollection([{ _id: 'r1', verified: true, helpfulCount: 5 }]);
    const req = new Request('http://localhost/api/reviews?listing=slug-1&sortBy=helpful');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.reviews[0]).toHaveProperty('isHelpful', true);
  });
});
