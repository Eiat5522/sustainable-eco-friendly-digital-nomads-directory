import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockRevalidateTag = jest.fn();
jest.mock('next/cache', () => ({
  __esModule: true,
  revalidateTag: mockRevalidateTag,
}));

const mockAuth: jest.Mock<() => Promise<any>> = jest.fn() as any;
jest.mock('@/lib/auth', () => ({
  __esModule: true,
  auth: mockAuth,
  GET: jest.fn(),
  POST: jest.fn(),
}));

// Mock Redis to prevent caching in integration tests
jest.mock('@/lib/redis', () => ({
  __esModule: true,
  getRedisClient: jest.fn(() => undefined),
}));

const mockEnsureSanityUser: jest.Mock<(user: any) => Promise<any>> = jest.fn() as any;
jest.mock('@/lib/sanity/user', () => ({
  __esModule: true,
  ensureSanityUser: mockEnsureSanityUser,
}));

import { GET, POST } from '../../../app/api/comments/route';
import { client } from '../../lib/sanity/client';

// Get the actual mock instances created by the __mocks__/@sanity/client.ts mock
const mockClientFetch = client.fetch as jest.MockedFunction<typeof client.fetch>;
const mockClientCreate = client.create as jest.MockedFunction<any>;
const mockClientGetDocument = client.getDocument as jest.MockedFunction<any>;
const parseJson = async (response: Response) => ({
  status: response.status,
  body: await response.json(),
});

describe('API /api/comments integration', () => {
  const postId = 'post-sustainable-living';
  const session = {
    user: {
      id: 'user-eco-1',
      role: 'user' as const,
      name: 'Taylor Traveler',
      email: 'taylor@example.com',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuth.mockResolvedValue(session);
    mockEnsureSanityUser.mockResolvedValue({ _id: 'sanity-user-eco-1' });
    mockClientGetDocument.mockImplementation(async (id: string) => {
      if (id === postId) {
        return { _id: postId, slug: { current: 'sustainable-living' } };
      }
      return null;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns populated comments for a blog post when approved entries exist', async () => {
    mockClientFetch.mockResolvedValueOnce([
      {
        _id: 'comment-1',
        content: 'Loved these tips!',
        approved: true,
        _createdAt: '2024-05-01T10:00:00.000Z',
        user: { _id: 'sanity-user-eco-2', name: 'Avery Adventurer' },
      },
    ]);

    const response = await GET(
      new Request(`http://localhost/api/comments?postId=${postId}&page=1&limit=10`)
    );
    const { status, body } = await parseJson(response);

    expect(status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: {
        comments: [
          {
            _id: 'comment-1',
            content: 'Loved these tips!',
            approved: true,
            _createdAt: '2024-05-01T10:00:00.000Z',
            user: { _id: 'sanity-user-eco-2', name: 'Avery Adventurer' },
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          count: 1,
        },
      },
    });

    expect(mockClientFetch).toHaveBeenCalledWith(expect.stringContaining('_type == "comment"'), {
      postId,
      skip: 0,
      end: 10,
    });
  });

  it('creates a comment and returns the Sanity payload with trimmed content', async () => {
    const createdComment = {
      _id: 'comment-2',
      _type: 'comment',
      content: 'Excited to visit these venues!',
      post: { _type: 'reference', _ref: postId },
      user: { _type: 'reference', _ref: 'sanity-user-eco-1' },
      approved: false,
    };

    mockClientCreate.mockImplementationOnce(async (doc: Record<string, unknown>) => ({
      ...createdComment,
      content: doc.content,
    }));

    const response = await POST(
      new Request('http://localhost/api/comments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ postId, content: '  Excited to visit these venues!  ' }),
      })
    );
    const { status, body } = await parseJson(response);

    expect(status).toBe(201);
    expect(body).toEqual({
      success: true,
      data: createdComment,
    });

    expect(mockEnsureSanityUser).toHaveBeenCalledWith({
      id: 'user-eco-1',
      name: 'Taylor Traveler',
      email: 'taylor@example.com',
      role: 'user',
    });

    expect(mockClientCreate).toHaveBeenCalledWith({
      _type: 'comment',
      post: { _type: 'reference', _ref: postId },
      user: { _type: 'reference', _ref: 'sanity-user-eco-1' },
      content: 'Excited to visit these venues!',
      approved: false,
    });
  });
});
