import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('next/cache', () => ({
  __esModule: true,
  revalidateTag: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/sanity/client', () => ({
  __esModule: true,
  client: jest.fn(() => ({
    fetch: jest.fn(),
    create: jest.fn(),
    getDocument: jest.fn(),
  })),
}));

import { auth } from '@/lib/auth';
import { client } from '@/lib/sanity/client';
import { ensureSanityUser } from '@/lib/sanity/user';
import { GET, POST } from '../../../app/api/comments/route';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockEnsureSanityUser = ensureSanityUser as unknown as {
  mockReset?: () => void;
  mockImplementation?: (fn: typeof ensureSanityUser) => void;
  mockResolvedValueOnce?: (value: unknown) => typeof ensureSanityUser;
};
const mockClientFetch = client.fetch as jest.Mock;
const mockClientCreate = client.create as jest.Mock;
const mockClientGetDocument = client.getDocument as jest.Mock;
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
    jest.resetAllMocks();

    mockAuth.mockResolvedValue(session);
    mockEnsureSanityUser.mockReset?.();
    mockEnsureSanityUser.mockImplementation?.((async () => ({ _id: 'sanity-user-eco-1' })) as any);
    mockClientGetDocument.mockImplementation(async (id: string) => {
      if (id === postId) {
        return { _id: postId, slug: { current: 'sustainable-living' } };
      }
      return null;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockEnsureSanityUser.mockReset?.();
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

    const ensureCalls = (mockEnsureSanityUser as any)?.mock?.calls ?? [];
    expect(ensureCalls[0]).toEqual({
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
