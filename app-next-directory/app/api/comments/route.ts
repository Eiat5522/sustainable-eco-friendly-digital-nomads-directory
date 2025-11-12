import { auth } from '@/lib/auth';
import { client } from '@/lib/sanity/client';
import { revalidateTag } from 'next/cache';
import { hasFeaturePermission, type UserRole } from '@/types/auth';
import { NextResponse } from 'next/server';
import { getRequestContext, structuredLogger } from '@/lib/logger';

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;
const DEFAULT_PAGE = 1;

type PaginationParams = {
  postId: string;
  page: number;
  limit: number;
  skip: number;
  end: number;
};

function successResponse<T>(data: T, status = 200, message?: string) {
  const payload = message === undefined ? { success: true, data } : { success: true, data, message };
  if (typeof NextResponse?.json === 'function') {
    const response = NextResponse.json(payload, { status });
    if (response) {
      return response;
    }
  }
  return {
    status,
    async json() {
      return payload;
    },
  } as Response;
}

function errorResponse(message: string, status: number, details?: unknown) {
  const body: Record<string, unknown> = { error: message };
  if (details !== undefined) {
    body.details = details;
  }
  if (typeof NextResponse?.json === 'function') {
    const response = NextResponse.json(body, { status });
    if (response) {
      return response;
    }
  }
  return {
    status,
    async json() {
      return body;
    },
  } as Response;
}

function parsePagination(request: Request):
  | { ok: true; params: PaginationParams }
  | { ok: false; response: Response } {
  if (!request || typeof request.url !== 'string') {
    return { ok: false, response: errorResponse('Missing postId', 400) };
  }

  let postId: string | null = null;
  let page = DEFAULT_PAGE;
  let limit = DEFAULT_LIMIT;

  try {
    const url = new URL(request.url);
    postId = url.searchParams.get('postId');
    const rawPage = url.searchParams.get('page');
    const rawLimit = url.searchParams.get('limit');

    if (rawPage !== null) {
      page = Number(rawPage);
    }
    if (rawLimit !== null) {
      limit = Number(rawLimit);
    }
  } catch {
    return { ok: false, response: errorResponse('Invalid request URL', 400) };
  }

  if (!postId || typeof postId !== 'string') {
    return { ok: false, response: errorResponse('Missing postId', 400) };
  }

  if (!Number.isInteger(page) || page < 1) {
    return { ok: false, response: errorResponse('Invalid pagination parameters', 400) };
  }

  if (!Number.isInteger(limit) || limit < 1) {
    return { ok: false, response: errorResponse('Invalid pagination parameters', 400) };
  }

  const boundedLimit = Math.min(MAX_LIMIT, limit);
  const skip = (page - 1) * boundedLimit;
  const end = skip + boundedLimit;

  return {
    ok: true,
    params: {
      postId,
      page,
      limit: boundedLimit,
      skip,
      end,
    },
  };
}

function normaliseContent(content: unknown): string | null {
  if (typeof content !== 'string') {
    return null;
  }
  const trimmed = content.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET(request: Request) {
  const pagination = parsePagination(request);
  if (!pagination.ok) {
    return pagination.response;
  }

  const { postId, page, limit, skip, end } = pagination.params;

  try {
    const query = `*[_type == "comment" && post._ref == $postId && approved == true]
      | order(_createdAt desc) [$skip...$end] {
        _id,
        content,
        approved,
        _createdAt,
        "user": user->{_id, name}
      }`;

    const comments = await client.fetch(query, { postId, skip, end });
    const safeComments = Array.isArray(comments) ? comments : [];

    return successResponse({
      comments: safeComments,
      pagination: {
        page,
        limit,
        count: safeComments.length,
      },
    });
  } catch (error) {
    structuredLogger.error('Failed to fetch comments', error, {
      ...getRequestContext(request),
      component: 'api/comments',
      postId,
    });
    return errorResponse('Failed to fetch comments', 500, error instanceof Error ? error.message : String(error));
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: UserRole; name?: string | null; email?: string | null } | undefined;
  const userId = user?.id;
  const role = user?.role ?? 'unidentifiedUser';

  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  if (!hasFeaturePermission(role, 'submitComments')) {
    return errorResponse('Forbidden: Insufficient permissions to create comments', 403);
  }

  if (!request || typeof request.json !== 'function') {
    return errorResponse('Invalid or missing fields', 422);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse('Invalid or missing fields', 422);
  }

  const isCommentPayload = (value: unknown): value is { postId?: unknown; content?: unknown } =>
    typeof value === 'object' && value !== null;

  const body = isCommentPayload(payload) ? payload : {};
  const postId = typeof body.postId === 'string' ? body.postId : null;
  const content = normaliseContent(body.content);

  if (!postId) {
    return errorResponse('Invalid or missing fields', 422);
  }

  if (!content) {
    return errorResponse('Comment is required', 422);
  }

  try {
    const { ensureSanityUser } = await import('@/lib/sanity/user');
    const sanityUser = await ensureSanityUser({
      id: userId,
      name: user?.name ?? null,
      email: user?.email ?? null,
      role,
    });

    const userRef = sanityUser?._id ?? userId;

    type PostDocument = {
      _id: string;
      slug?: { current?: string | null } | null;
    };

    const postDoc = await client.getDocument<PostDocument>(postId);
    if (!postDoc) {
      return errorResponse('Invalid reference(s)', 400);
    }

    const created = await client.create({
      _type: 'comment',
      post: { _type: 'reference', _ref: postId },
      user: { _type: 'reference', _ref: userRef },
      content,
      approved: false,
    });

    const slug = postDoc.slug?.current ?? undefined;
    if (slug) {
      try {
        revalidateTag(`post:${slug}`);
      } catch (error) {
        structuredLogger.warn('Failed to revalidate comment tag', {
          component: 'api/comments',
          slug,
          postId,
          revalidationError: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return successResponse(created, 201);
  } catch (error) {
    structuredLogger.error('Failed to create comment', error, {
      ...getRequestContext(request),
      component: 'api/comments',
      postId,
    });
    return errorResponse('Internal Server Error', 500);
  }
}

export const dynamic = 'force-dynamic';
