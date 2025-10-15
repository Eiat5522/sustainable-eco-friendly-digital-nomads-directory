/**
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { UserRole } from '@/types/auth';

import { ensureSanityUser } from '@/lib/sanity/user';
import * as authModule from '@/lib/auth';
import { client } from '@/lib/sanity/client';

const mockAuth = jest.spyOn(authModule, 'auth');
const mockRevalidateTag = jest.fn();
jest.mock('next/cache', () => ({
  __esModule: true,
  revalidateTag: mockRevalidateTag,
}));
const mockGetDocument = jest.spyOn(client, 'getDocument');
const mockCreate = jest.spyOn(client, 'create');

let postHandler: typeof import('../route').POST;

type EnsureSanityUserMock = typeof ensureSanityUser & {
  mockResolvedValueOnce: (value: any) => EnsureSanityUserMock;
  mockImplementation: (impl: (...args: any[]) => any) => EnsureSanityUserMock;
  mockClear: () => EnsureSanityUserMock;
  mockReset: () => EnsureSanityUserMock;
  mock: { calls: unknown[] };
};

const ensureSanityUserMock = ensureSanityUser as EnsureSanityUserMock;

const createRequest = (body: unknown) =>
  new Request('http://localhost/api/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const mockAuthenticatedSession = (
  overrides: Partial<{
    id: string;
    role: UserRole;
    email: string | null;
    name: string | null;
  }> = {}
) => {
  const {
    id = 'user-1',
    role = 'user' as UserRole,
    email = 'user@example.com',
    name = 'User Example',
  } = overrides;

  mockAuth.mockImplementation(async () => ({
    user: {
      id,
      role,
      email,
      name,
    },
  }));
};

describe('POST /api/comments', () => {
  beforeAll(async () => {
    ({ POST: postHandler } = await import('../route'));
  });

  beforeEach(() => {
    mockAuth.mockReset();
    mockRevalidateTag.mockReset();
    mockGetDocument.mockReset();
    mockCreate.mockReset();
    mockRevalidateTag.mockImplementation(() => {});
    mockGetDocument.mockImplementation(async () => ({
      _id: 'default-post',
      slug: { current: null },
    }) as any);
    mockCreate.mockImplementation(async () => ({ _id: 'default-comment' } as any));
    ensureSanityUserMock.mockReset?.();
    ensureSanityUserMock.mockImplementation?.(async ({ id, name, email, role }) => ({
      _id: `sanity-${id}`,
      _type: 'user',
      name: name ?? undefined,
      email: email ?? undefined,
      role: role ?? 'user',
    }));
  });

  it('returns 401 when the user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await postHandler(createRequest({ content: 'Hello world', postId: 'post-1' }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
    expect(mockAuth).toHaveBeenCalled();
    expect(mockGetDocument).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns 403 when the user lacks comment permission', async () => {
    mockAuthenticatedSession({ role: 'unidentifiedUser' as UserRole });

    const response = await postHandler(createRequest({ content: 'Nice read', postId: 'post-1' }));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'Forbidden: Insufficient permissions to create comments' });
    expect(mockGetDocument).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns 422 when the payload is missing content', async () => {
    mockAuthenticatedSession();

    const response = await postHandler(createRequest({ postId: 'post-1' }));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body).toEqual({ error: 'Invalid or missing fields' });
    expect(mockGetDocument).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns 422 when the content is only whitespace', async () => {
    mockAuthenticatedSession();

    const response = await postHandler(createRequest({ content: '   ', postId: 'post-1' }));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body).toEqual({ error: 'Comment is required' });
    expect(mockGetDocument).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns 400 when the referenced post or user is missing', async () => {
    mockAuthenticatedSession();
    mockGetDocument.mockResolvedValueOnce(null);

    const response = await postHandler(createRequest({ content: 'Looking forward to more!', postId: 'post-1' }));
    const body = await response.json();

    expect(mockGetDocument).toHaveBeenCalledWith('post-1');
    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid reference(s)' });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('creates a comment and revalidates the post tag when successful', async () => {
    mockAuthenticatedSession();
    mockGetDocument.mockResolvedValueOnce({
      _id: 'post-1',
      slug: { current: 'sustainable-living' },
    });
    const createdComment = { _id: 'comment-1', content: 'Great insights!' };
    mockCreate.mockResolvedValueOnce(createdComment);

    const response = await postHandler(createRequest({ content: 'Great insights!', postId: 'post-1' }));
    const body = await response.json();

    expect(mockGetDocument).toHaveBeenCalledWith('post-1');
    expect(mockCreate).toHaveBeenCalledWith({
      _type: 'comment',
      post: { _type: 'reference', _ref: 'post-1' },
      user: { _type: 'reference', _ref: 'sanity-user-1' },
      content: 'Great insights!',
      approved: false,
    });
    expect(response.status).toBe(200);
    expect(body).toEqual(createdComment);
    expect(mockRevalidateTag).toHaveBeenCalledWith('post:sustainable-living');
  });

  it('handles unexpected errors gracefully', async () => {
    mockAuthenticatedSession();

    const failingRequest = new Request('http://localhost/api/comments', { method: 'POST' });
    // Override the json method to simulate a parse failure
    jest.spyOn(failingRequest, 'json').mockRejectedValue(new Error('parse failure'));

    const response = await postHandler(failingRequest);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Internal Server Error' });
    expect(mockGetDocument).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
